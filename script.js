document.addEventListener('DOMContentLoaded', () => {
    const startScreen = document.getElementById('start-screen');
    const quizScreen = document.getElementById('quiz-screen');
    const scoreScreen = document.getElementById('score-screen');

    const startQuizBtn = document.getElementById('start-quiz-btn');
    const questionTextEl = document.getElementById('question-text');
    const optionsContainer = document.getElementById('options-container');
    const fillInBlankInput = document.getElementById('fill-in-blank-input');
    const submitAnswerBtn = document.getElementById('submit-answer-btn');
    const nextQuestionBtn = document.getElementById('next-question-btn');
    const feedbackTextEl = document.getElementById('feedback-text');
    const progressTextEl = document.getElementById('progress-text');
    const scoreTextEl = document.getElementById('score-text');
    const restartQuizBtn = document.getElementById('restart-quiz-btn');

    let allQuestions = [];
    let currentQuestionIndex = 0;
    let score = 0;
    let currentQuestionData;

    async function loadQuestions() {
        try {
            const [finalResponse, midtermResponse] = await Promise.all([
                fetch('quiz_final.json'),
                fetch('quiz_midterm.json'),
            ]);


            if (!finalResponse.ok || !midtermResponse.ok) {
                throw new Error('Failed to load quiz data.');
            }

            const finalQuestions = await finalResponse.json();
            const midtermQuestions = await midtermResponse.json();
            
            allQuestions = [...midtermQuestions, ...finalQuestions];
            shuffleArray(allQuestions); // Shuffle for variety
            console.log(`Loaded ${allQuestions.length} questions.`);

        } catch (error) {
            console.error("Error loading questions:", error);
            questionTextEl.textContent = "Error loading questions. Please try refreshing.";
            // Potentially disable start button or show error more prominently
        }
    }

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    function startQuiz() {
        currentQuestionIndex = 0;
        score = 0;
        startScreen.style.display = 'none';
        scoreScreen.style.display = 'none';
        quizScreen.style.display = 'block';
        nextQuestionBtn.style.display = 'none';
        submitAnswerBtn.style.display = 'inline-block';
        submitAnswerBtn.disabled = false;
        feedbackTextEl.textContent = '';
        feedbackTextEl.className = '';
        displayQuestion();
    }

    function displayQuestion() {
        if (currentQuestionIndex >= allQuestions.length) {
            showScore();
            return;
        }

        currentQuestionData = allQuestions[currentQuestionIndex];
        questionTextEl.textContent = currentQuestionData.question.replace(/\t/g, ' ').trim(); // Clean tabs
        optionsContainer.innerHTML = '';
        fillInBlankInput.style.display = 'none';
        fillInBlankInput.value = ''; // Clear previous input

        progressTextEl.textContent = `Question ${currentQuestionIndex + 1} of ${allQuestions.length}`;

        if (currentQuestionData.options.length === 1 && currentQuestionData.options[0].toLowerCase() === 'nan') {
            // Fill-in-the-blank type question
            fillInBlankInput.style.display = 'block';
            optionsContainer.style.display = 'none';
        } else {
            // Multiple choice or True/False
            optionsContainer.style.display = 'block';
            currentQuestionData.options.forEach((option, index) => {
                const optionLabel = document.createElement('label');
                optionLabel.className = 'option-label';
                
                const radioButton = document.createElement('input');
                radioButton.type = 'radio';
                radioButton.name = 'option';
                radioButton.value = option.trim(); // Trim option text
                radioButton.id = `option-${index}`;

                optionLabel.appendChild(radioButton);
                optionLabel.appendChild(document.createTextNode(option.trim())); // Trim option text
                optionsContainer.appendChild(optionLabel);
            });
        }
        submitAnswerBtn.disabled = false;
        nextQuestionBtn.style.display = 'none';
        feedbackTextEl.textContent = '';
        feedbackTextEl.className = '';
    }

    function handleSubmitAnswer() {
        let userAnswer;
        const selectedOption = document.querySelector('input[name="option"]:checked');

        if (currentQuestionData.options.length === 1 && currentQuestionData.options[0].toLowerCase() === 'nan') {
            userAnswer = fillInBlankInput.value.trim();
        } else if (selectedOption) {
            userAnswer = selectedOption.value;
        } else {
            feedbackTextEl.textContent = "Please select an answer or type one in.";
            feedbackTextEl.className = "incorrect";
            return; // Don't proceed if no answer
        }

        let isCorrect = false;
        let correctAnswerNormalized;

        if (typeof currentQuestionData.answer === 'boolean') {
            // For True/False questions where answer is boolean
            correctAnswerNormalized = currentQuestionData.answer.toString(); // "true" or "false"
            isCorrect = userAnswer.toLowerCase() === correctAnswerNormalized.toLowerCase();
        } else {
            // For string answers (including those with \n for multiple valid options)
            const correctAnswers = currentQuestionData.answer.toString().split('\n').map(ans => ans.trim().toLowerCase());
            correctAnswerNormalized = correctAnswers.join(' OR '); // For display
            isCorrect = correctAnswers.includes(userAnswer.toLowerCase());
        }
        
        if (isCorrect) {
            score++;
            feedbackTextEl.textContent = "Correct!";
            feedbackTextEl.className = "correct";
        } else {
            feedbackTextEl.textContent = `Incorrect. The correct answer is: ${correctAnswerNormalized}`;
            feedbackTextEl.className = "incorrect";
        }

        submitAnswerBtn.disabled = true;
        nextQuestionBtn.style.display = 'inline-block';

        // Disable radio buttons after submission
        const radioButtons = document.querySelectorAll('input[name="option"]');
        radioButtons.forEach(rb => rb.disabled = true);
        fillInBlankInput.disabled = true;
    }

    function handleNextQuestion() {
        currentQuestionIndex++;
        feedbackTextEl.textContent = '';
        feedbackTextEl.className = '';
        submitAnswerBtn.style.display = 'inline-block';
        submitAnswerBtn.disabled = false; // Re-enable for next question
        nextQuestionBtn.style.display = 'none';
        
        // Re-enable radio buttons and input for next question
        const radioButtons = document.querySelectorAll('input[name="option"]');
        radioButtons.forEach(rb => rb.disabled = false);
        fillInBlankInput.disabled = false;

        displayQuestion();
    }

    function showScore() {
        quizScreen.style.display = 'none';
        scoreScreen.style.display = 'block';
        scoreTextEl.textContent = `You scored ${score} out of ${allQuestions.length}!`;
    }

    startQuizBtn.addEventListener('click', () => {
        if (allQuestions.length > 0) {
            startQuiz();
        } else {
            // This might happen if JSON loading failed silently or is slow
            alert("Questions are still loading or failed to load. Please wait or refresh.");
        }
    });
    submitAnswerBtn.addEventListener('click', handleSubmitAnswer);
    nextQuestionBtn.addEventListener('click', handleNextQuestion);
    restartQuizBtn.addEventListener('click', () => {
        // Re-shuffle or not? For now, let's keep the shuffled order for a restart within the session
        // If you want to re-shuffle for every restart:
        // shuffleArray(allQuestions);
        startQuiz();
    });

    // Load questions when the page loads
    loadQuestions();
});
"""
PDF Quiz Generator

This script extracts text from PDF files and generates interactive quizzes
with multiple choice and true/false questions using AI.

Prerequisites:
1. Install required packages:
   pip install PyPDF2 requests

2. Set up Hugging Face API key (FREE):
   - Get your API key from https://huggingface.co/settings/tokens
   - Set environment variable: HUGGINGFACE_API_KEY=your_key_here
   OR
   - Pass it via --api-key argument
   
   Note: Hugging Face offers free API access with rate limits.

Usage:
    python quiz_generator.py --pdf "document.pdf" --questions 10 --output "quiz.html"
"""

import os
import sys
import json
import argparse
from pathlib import Path
from datetime import datetime
import time
import PyPDF2
import requests

# Get the directory where this script is located
SCRIPT_DIR = Path(__file__).parent.absolute()


def extract_text_from_pdf(pdf_path):
    """Extract text content from a PDF file."""
    try:
        print(f"Reading PDF: {pdf_path}")
        
        with open(pdf_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            num_pages = len(pdf_reader.pages)
            print(f"Found {num_pages} pages")
            
            text_content = []
            for page_num in range(num_pages):
                page = pdf_reader.pages[page_num]
                text = page.extract_text()
                if text.strip():
                    text_content.append(text)
            
            full_text = "\n\n".join(text_content)
            print(f"Extracted {len(full_text)} characters")
            
            return full_text
    
    except Exception as e:
        print(f"Error reading PDF: {e}")
        sys.exit(1)


def generate_quiz_with_ai(content, num_questions, api_key):
    """Generate quiz questions using Hugging Face API (FREE)."""
    try:
        print(f"\nGenerating {num_questions} questions using AI...")
        
        # Using Hugging Face's free inference API
        API_URL = "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2"
        headers = {"Authorization": f"Bearer {api_key}"}
        
        # Limit content size
        max_chars = 3000  # Smaller limit for free API
        if len(content) > max_chars:
            print(f"Content too long ({len(content)} chars), truncating to {max_chars} chars")
            content = content[:max_chars]
        
        prompt = f"""Based on this document, create {num_questions} quiz questions in JSON format.
Mix multiple choice (4 options) and true/false questions.

Return ONLY a JSON array, no other text:
[
  {{"type": "multiple_choice", "question": "What is...", "options": ["A", "B", "C", "D"], "correct_answer": 0, "explanation": "Because..."}},
  {{"type": "true_false", "question": "The document states...", "correct_answer": true, "explanation": "Because..."}}
]

Document: {content}

JSON array:"""

        payload = {
            "inputs": prompt,
            "parameters": {
                "max_new_tokens": 2000,
                "temperature": 0.7,
                "return_full_text": False
            }
        }
        
        max_retries = 3
        for attempt in range(max_retries):
            response = requests.post(API_URL, headers=headers, json=payload)
            
            if response.status_code == 503:
                print(f"Model is loading, waiting... (attempt {attempt + 1}/{max_retries})")
                time.sleep(20)
                continue
            elif response.status_code == 200:
                break
            else:
                print(f"API Error: {response.status_code}")
                print(response.text)
                if attempt < max_retries - 1:
                    print("Retrying...")
                    time.sleep(5)
                else:
                    sys.exit(1)
        
        result = response.json()
        
        if isinstance(result, list) and len(result) > 0:
            response_text = result[0].get('generated_text', '')
        else:
            response_text = str(result)
        
        # Clean up response
        response_text = response_text.strip()
        
        # Find JSON array in response
        start_idx = response_text.find('[')
        end_idx = response_text.rfind(']')
        
        if start_idx != -1 and end_idx != -1:
            json_text = response_text[start_idx:end_idx + 1]
        else:
            json_text = response_text
        
        # Remove markdown code blocks if present
        json_text = json_text.replace('```json', '').replace('```', '').strip()
        
        # Parse JSON
        try:
            questions = json.loads(json_text)
        except json.JSONDecodeError:
            # Fallback: Try to find and parse JSON from the response
            import re
            json_match = re.search(r'\[.*\]', response_text, re.DOTALL)
            if json_match:
                questions = json.loads(json_match.group())
            else:
                # If all parsing fails, create sample questions
                print("Warning: Could not parse AI response, generating sample questions...")
                questions = generate_sample_questions(num_questions, content)
        
        if not isinstance(questions, list):
            questions = [questions]
        
        # Ensure we have the requested number of questions
        if len(questions) < num_questions:
            print(f"Warning: Only generated {len(questions)} questions (requested {num_questions})")
        
        print(f"✓ Generated {len(questions)} questions")
        return questions[:num_questions]
    
    except Exception as e:
        print(f"Error generating quiz: {e}")
        print("Generating sample questions as fallback...")
        return generate_sample_questions(num_questions, content)


def generate_sample_questions(num_questions, content):
    """Generate sample questions if AI fails."""
    # Extract some sentences from content for questions
    sentences = [s.strip() for s in content.split('.') if len(s.strip()) > 20][:10]
    
    questions = []
    for i in range(min(num_questions, len(sentences))):
        if i % 2 == 0:
            # Multiple choice
            questions.append({
                "type": "multiple_choice",
                "question": f"According to the document: {sentences[i][:100]}... What does this refer to?",
                "options": [
                    "Option A - Please review document",
                    "Option B - Please review document", 
                    "Option C - Please review document",
                    "Option D - Please review document"
                ],
                "correct_answer": 0,
                "explanation": "Please review the document for the correct answer."
            })
        else:
            # True/False
            questions.append({
                "type": "true_false",
                "question": f"The document mentions: {sentences[i][:100]}",
                "correct_answer": True,
                "explanation": "This statement appears in the document."
            })
    
    return questions


def generate_html_quiz(questions, pdf_name, output_path):
    """Generate an interactive HTML quiz."""
    
    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Quiz: {pdf_name}</title>
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }}
        
        .container {{
            max-width: 800px;
            margin: 0 auto;
        }}
        
        .header {{
            background: white;
            padding: 30px;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            margin-bottom: 30px;
            text-align: center;
        }}
        
        .header h1 {{
            color: #333;
            margin-bottom: 10px;
        }}
        
        .header .source {{
            color: #666;
            font-size: 14px;
        }}
        
        .progress-bar {{
            background: white;
            padding: 20px;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            margin-bottom: 20px;
        }}
        
        .progress-bar .progress {{
            background: #e0e0e0;
            height: 10px;
            border-radius: 5px;
            overflow: hidden;
        }}
        
        .progress-bar .progress-fill {{
            background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
            height: 100%;
            transition: width 0.3s ease;
        }}
        
        .progress-text {{
            text-align: center;
            margin-top: 10px;
            color: #333;
            font-weight: 600;
        }}
        
        .question-card {{
            background: white;
            padding: 30px;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            margin-bottom: 20px;
            display: none;
        }}
        
        .question-card.active {{
            display: block;
        }}
        
        .question-number {{
            color: #667eea;
            font-weight: 600;
            margin-bottom: 15px;
        }}
        
        .question-text {{
            font-size: 20px;
            color: #333;
            margin-bottom: 25px;
            line-height: 1.6;
        }}
        
        .option {{
            background: #f5f5f5;
            padding: 15px 20px;
            border-radius: 10px;
            margin-bottom: 10px;
            cursor: pointer;
            transition: all 0.3s ease;
            border: 2px solid transparent;
        }}
        
        .option:hover {{
            background: #e8e8e8;
            transform: translateX(5px);
        }}
        
        .option.selected {{
            background: #e3f2fd;
            border-color: #667eea;
        }}
        
        .option.correct {{
            background: #c8e6c9;
            border-color: #4caf50;
        }}
        
        .option.incorrect {{
            background: #ffcdd2;
            border-color: #f44336;
        }}
        
        .option.disabled {{
            cursor: not-allowed;
            opacity: 0.7;
        }}
        
        .explanation {{
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            border-radius: 5px;
            margin-top: 20px;
            display: none;
        }}
        
        .explanation.show {{
            display: block;
        }}
        
        .explanation strong {{
            color: #856404;
        }}
        
        .button-container {{
            display: flex;
            gap: 10px;
            margin-top: 20px;
        }}
        
        button {{
            padding: 12px 30px;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
        }}
        
        .btn-primary {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            flex: 1;
        }}
        
        .btn-primary:hover {{
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }}
        
        .btn-secondary {{
            background: #e0e0e0;
            color: #333;
        }}
        
        .btn-secondary:hover {{
            background: #d0d0d0;
        }}
        
        button:disabled {{
            opacity: 0.5;
            cursor: not-allowed;
        }}
        
        .results {{
            background: white;
            padding: 40px;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            text-align: center;
            display: none;
        }}
        
        .results.show {{
            display: block;
        }}
        
        .results h2 {{
            color: #333;
            margin-bottom: 20px;
        }}
        
        .score {{
            font-size: 60px;
            font-weight: bold;
            color: #667eea;
            margin: 20px 0;
        }}
        
        .score-text {{
            font-size: 20px;
            color: #666;
            margin-bottom: 30px;
        }}
        
        .stats {{
            display: flex;
            justify-content: space-around;
            margin: 30px 0;
        }}
        
        .stat {{
            text-align: center;
        }}
        
        .stat-number {{
            font-size: 36px;
            font-weight: bold;
            color: #333;
        }}
        
        .stat-label {{
            color: #666;
            margin-top: 5px;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📚 Quiz Time!</h1>
            <div class="source">Based on: {pdf_name}</div>
        </div>
        
        <div class="progress-bar">
            <div class="progress">
                <div class="progress-fill" id="progressFill"></div>
            </div>
            <div class="progress-text" id="progressText">Question 1 of {len(questions)}</div>
        </div>
        
        <div id="quizContainer">
"""
    
    # Generate question cards
    for i, q in enumerate(questions):
        question_html = f"""
            <div class="question-card" id="question{i}" data-index="{i}">
                <div class="question-number">Question {i + 1} of {len(questions)}</div>
                <div class="question-text">{q['question']}</div>
"""
        
        if q['type'] == 'multiple_choice':
            for j, option in enumerate(q['options']):
                question_html += f"""
                <div class="option" data-option="{j}" onclick="selectOption(this, {i})">
                    {chr(65 + j)}. {option}
                </div>
"""
        else:  # true_false
            question_html += f"""
                <div class="option" data-option="true" onclick="selectOption(this, {i})">
                    True
                </div>
                <div class="option" data-option="false" onclick="selectOption(this, {i})">
                    False
                </div>
"""
        
        explanation = q.get('explanation', '')
        question_html += f"""
                <div class="explanation" id="explanation{i}">
                    <strong>Explanation:</strong> {explanation}
                </div>
                
                <div class="button-container">
                    <button class="btn-secondary" onclick="previousQuestion()" id="prevBtn{i}" {"style='display:none;'" if i == 0 else ""}>← Previous</button>
                    <button class="btn-primary" onclick="checkAnswer({i})" id="checkBtn{i}">Check Answer</button>
                    <button class="btn-primary" onclick="nextQuestion()" id="nextBtn{i}" style="display:none;">Next →</button>
                    <button class="btn-primary" onclick="showResults()" id="finishBtn{i}" style="display:none;">Finish Quiz</button>
                </div>
            </div>
"""
        
        html_content += question_html
    
    # Add results section
    html_content += """
        </div>
        
        <div class="results" id="results">
            <h2>🎉 Quiz Complete!</h2>
            <div class="score" id="scoreDisplay">0%</div>
            <div class="score-text" id="scoreText"></div>
            
            <div class="stats">
                <div class="stat">
                    <div class="stat-number" id="correctCount">0</div>
                    <div class="stat-label">Correct</div>
                </div>
                <div class="stat">
                    <div class="stat-number" id="incorrectCount">0</div>
                    <div class="stat-label">Incorrect</div>
                </div>
                <div class="stat">
                    <div class="stat-number" id="totalCount">0</div>
                    <div class="stat-label">Total</div>
                </div>
            </div>
            
            <button class="btn-primary" onclick="restartQuiz()">Try Again</button>
        </div>
    </div>
    
    <script>
        const questions = """ + json.dumps(questions) + """;
        let currentQuestion = 0;
        let userAnswers = new Array(questions.length).fill(null);
        let isAnswerChecked = new Array(questions.length).fill(false);
        
        // Show first question
        document.getElementById('question0').classList.add('active');
        
        function selectOption(element, questionIndex) {
            if (isAnswerChecked[questionIndex]) return;
            
            const card = document.getElementById(`question${questionIndex}`);
            const options = card.querySelectorAll('.option');
            
            options.forEach(opt => opt.classList.remove('selected'));
            element.classList.add('selected');
            
            const optionValue = element.getAttribute('data-option');
            userAnswers[questionIndex] = optionValue;
        }
        
        function checkAnswer(questionIndex) {
            if (userAnswers[questionIndex] === null) {
                alert('Please select an answer first!');
                return;
            }
            
            isAnswerChecked[questionIndex] = true;
            
            const question = questions[questionIndex];
            const card = document.getElementById(`question${questionIndex}`);
            const options = card.querySelectorAll('.option');
            const explanation = document.getElementById(`explanation${questionIndex}`);
            
            let isCorrect = false;
            
            if (question.type === 'multiple_choice') {
                const selectedIndex = parseInt(userAnswers[questionIndex]);
                isCorrect = selectedIndex === question.correct_answer;
                
                options.forEach((opt, idx) => {
                    opt.classList.add('disabled');
                    if (idx === question.correct_answer) {
                        opt.classList.add('correct');
                    } else if (idx === selectedIndex && !isCorrect) {
                        opt.classList.add('incorrect');
                    }
                });
            } else {
                const selectedValue = userAnswers[questionIndex] === 'true';
                isCorrect = selectedValue === question.correct_answer;
                
                options.forEach(opt => {
                    opt.classList.add('disabled');
                    const optValue = opt.getAttribute('data-option') === 'true';
                    if (optValue === question.correct_answer) {
                        opt.classList.add('correct');
                    } else if (optValue === selectedValue && !isCorrect) {
                        opt.classList.add('incorrect');
                    }
                });
            }
            
            explanation.classList.add('show');
            
            document.getElementById(`checkBtn${questionIndex}`).style.display = 'none';
            
            if (questionIndex < questions.length - 1) {
                document.getElementById(`nextBtn${questionIndex}`).style.display = 'block';
            } else {
                document.getElementById(`finishBtn${questionIndex}`).style.display = 'block';
            }
        }
        
        function nextQuestion() {
            if (currentQuestion < questions.length - 1) {
                document.getElementById(`question${currentQuestion}`).classList.remove('active');
                currentQuestion++;
                document.getElementById(`question${currentQuestion}`).classList.add('active');
                updateProgress();
            }
        }
        
        function previousQuestion() {
            if (currentQuestion > 0) {
                document.getElementById(`question${currentQuestion}`).classList.remove('active');
                currentQuestion--;
                document.getElementById(`question${currentQuestion}`).classList.add('active');
                updateProgress();
            }
        }
        
        function updateProgress() {
            const progress = ((currentQuestion + 1) / questions.length) * 100;
            document.getElementById('progressFill').style.width = progress + '%';
            document.getElementById('progressText').textContent = `Question ${currentQuestion + 1} of ${questions.length}`;
        }
        
        function showResults() {
            let correctCount = 0;
            
            questions.forEach((question, index) => {
                if (question.type === 'multiple_choice') {
                    if (parseInt(userAnswers[index]) === question.correct_answer) {
                        correctCount++;
                    }
                } else {
                    const userAnswer = userAnswers[index] === 'true';
                    if (userAnswer === question.correct_answer) {
                        correctCount++;
                    }
                }
            });
            
            const incorrectCount = questions.length - correctCount;
            const percentage = Math.round((correctCount / questions.length) * 100);
            
            document.getElementById('quizContainer').style.display = 'none';
            document.querySelector('.progress-bar').style.display = 'none';
            
            document.getElementById('scoreDisplay').textContent = percentage + '%';
            document.getElementById('correctCount').textContent = correctCount;
            document.getElementById('incorrectCount').textContent = incorrectCount;
            document.getElementById('totalCount').textContent = questions.length;
            
            let scoreText = '';
            if (percentage === 100) {
                scoreText = 'Perfect! Outstanding work! 🌟';
            } else if (percentage >= 80) {
                scoreText = 'Excellent job! Great understanding! 👏';
            } else if (percentage >= 60) {
                scoreText = 'Good effort! Keep learning! 📚';
            } else {
                scoreText = 'Keep studying! You can do better! 💪';
            }
            
            document.getElementById('scoreText').textContent = scoreText;
            document.getElementById('results').classList.add('show');
        }
        
        function restartQuiz() {
            location.reload();
        }
    </script>
</body>
</html>
"""
    
    # Write HTML file
    try:
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(html_content)
        print(f"✓ Quiz saved to: {output_path}")
    except Exception as e:
        print(f"Error writing HTML file: {e}")
        sys.exit(1)


def main():
    parser = argparse.ArgumentParser(
        description='Generate interactive quizzes from PDF documents'
    )
    parser.add_argument(
        '--pdf',
        required=True,
        help='Path to the PDF file'
    )
    parser.add_argument(
        '--questions',
        type=int,
        default=10,
        help='Number of questions to generate (default: 10)'
    )
    parser.add_argument(
        '--output',
        default=None,
        help='Output HTML file path (default: quiz_[timestamp].html)'
    )
    parser.add_argument(
        '--api-key',
        default=None,
        help='Hugging Face API key (or set HUGGINGFACE_API_KEY environment variable)'
    )
    
    args = parser.parse_args()
    
    # Check API key
    api_key = args.api_key or os.environ.get('HUGGINGFACE_API_KEY')
    if not api_key:
        print("ERROR: Hugging Face API key not found!")
        print("Either:")
        print("  1. Set environment variable: HUGGINGFACE_API_KEY=your_key")
        print("  2. Use --api-key argument")
        print("\nGet your FREE API key at: https://huggingface.co/settings/tokens")
        print("Note: Hugging Face offers free API access!")
        sys.exit(1)
    
    # Check PDF exists
    pdf_path = Path(args.pdf)
    if not pdf_path.exists():
        print(f"ERROR: PDF file not found: {pdf_path}")
        sys.exit(1)
    
    # Generate output filename if not provided
    if args.output:
        output_path = Path(args.output)
    else:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_path = SCRIPT_DIR / f"quiz_{timestamp}.html"
    
    print("="*60)
    print("PDF QUIZ GENERATOR")
    print("="*60)
    
    # Extract text from PDF
    content = extract_text_from_pdf(pdf_path)
    
    if not content.strip():
        print("ERROR: No text content found in PDF")
        sys.exit(1)
    
    # Generate quiz questions
    questions = generate_quiz_with_ai(content, args.questions, api_key)
    
    # Generate HTML quiz
    generate_html_quiz(questions, pdf_path.name, output_path)
    
    print("="*60)
    print(f"✓ Success! Open the quiz in your browser:")
    print(f"  {output_path.absolute()}")
    print("="*60)


if __name__ == '__main__':
    main()
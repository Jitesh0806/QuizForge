"""
AI service for generating quiz questions.
Supports both Google Gemini (free tier) and OpenAI.
Falls back to mock data if no API key is configured.
"""
import json
import re
import os
import logging

logger = logging.getLogger(__name__)


def generate_quiz_questions(topic: str, num_questions: int, difficulty: str) -> list[dict]:
    """
    Generate quiz questions using AI.
    
    Returns a list of dicts:
    [
        {
            "text": "Question text?",
            "explanation": "Why this answer is correct...",
            "choices": [
                {"text": "Option A", "is_correct": False},
                {"text": "Option B", "is_correct": True},
                {"text": "Option C", "is_correct": False},
                {"text": "Option D", "is_correct": False},
            ]
        },
        ...
    ]
    """
    gemini_key = os.environ.get('GEMINI_API_KEY', '')
    openai_key = os.environ.get('OPENAI_API_KEY', '')

    if gemini_key:
        return _generate_with_gemini(topic, num_questions, difficulty, gemini_key)
    elif openai_key:
        return _generate_with_openai(topic, num_questions, difficulty, openai_key)
    else:
        logger.warning("No AI API key configured. Using mock questions.")
        return _generate_mock_questions(topic, num_questions, difficulty)


def _build_prompt(topic: str, num_questions: int, difficulty: str) -> str:
    difficulty_guide = {
        'easy': 'basic, introductory-level questions suitable for beginners',
        'medium': 'intermediate questions that require some knowledge of the topic',
        'hard': 'advanced, challenging questions requiring deep expertise',
    }
    return f"""Generate exactly {num_questions} multiple-choice quiz questions about "{topic}".
Difficulty: {difficulty} ({difficulty_guide.get(difficulty, 'medium')})

Requirements:
- Each question must have exactly 4 answer choices (A, B, C, D)
- Exactly one choice must be correct
- Choices should be plausible and not obviously wrong
- Include a brief explanation for why the correct answer is right

Respond with ONLY a valid JSON array. No markdown, no backticks, no explanation outside the JSON.

Format:
[
  {{
    "text": "Question text here?",
    "explanation": "Brief explanation of why the correct answer is right.",
    "choices": [
      {{"text": "First option", "is_correct": false}},
      {{"text": "Second option", "is_correct": true}},
      {{"text": "Third option", "is_correct": false}},
      {{"text": "Fourth option", "is_correct": false}}
    ]
  }}
]"""


def _parse_ai_response(raw_text: str) -> list[dict]:
    """Parse and validate AI response into question list."""
    # Strip markdown code fences if present
    text = raw_text.strip()
    text = re.sub(r'^```(?:json)?\s*', '', text)
    text = re.sub(r'\s*```$', '', text)
    text = text.strip()

    questions = json.loads(text)

    if not isinstance(questions, list):
        raise ValueError("Expected a JSON array of questions")

    validated = []
    for i, q in enumerate(questions):
        if not isinstance(q, dict):
            continue
        if 'text' not in q or 'choices' not in q:
            continue
        choices = q['choices']
        if len(choices) != 4:
            continue
        correct_count = sum(1 for c in choices if c.get('is_correct'))
        if correct_count != 1:
            continue
        validated.append({
            'text': q['text'],
            'explanation': q.get('explanation', ''),
            'choices': [
                {
                    'text': c['text'],
                    'is_correct': bool(c.get('is_correct', False))
                }
                for c in choices
            ]
        })

    return validated


def _generate_with_gemini(topic: str, num_questions: int, difficulty: str, api_key: str) -> list[dict]:
    """Generate questions using Google Gemini API."""
    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.5-flash')
        prompt = _build_prompt(topic, num_questions, difficulty)
        response = model.generate_content(prompt)
        return _parse_ai_response(response.text)
    except Exception as e:
        logger.error(f"Gemini generation failed: {e}")
        raise


def _generate_with_openai(topic: str, num_questions: int, difficulty: str, api_key: str) -> list[dict]:
    """Generate questions using OpenAI API."""
    try:
        from openai import OpenAI
        client = OpenAI(api_key=api_key)
        prompt = _build_prompt(topic, num_questions, difficulty)
        response = client.chat.completions.create(
            model='gpt-3.5-turbo',
            messages=[
                {
                    'role': 'system',
                    'content': 'You are a quiz generator. You always respond with valid JSON only.'
                },
                {'role': 'user', 'content': prompt}
            ],
            temperature=0.7,
        )
        return _parse_ai_response(response.choices[0].message.content)
    except Exception as e:
        logger.error(f"OpenAI generation failed: {e}")
        raise


def _generate_mock_questions(topic: str, num_questions: int, difficulty: str) -> list[dict]:
    """
    Fallback mock questions for development/testing when no AI key is set.
    In production, always configure a real AI API key.
    """
    questions = []
    for i in range(1, num_questions + 1):
        questions.append({
            'text': f'[Mock Q{i}] What is an important concept related to "{topic}"?',
            'explanation': f'This is a mock explanation for question {i} about {topic}.',
            'choices': [
                {'text': f'Mock answer A for question {i}', 'is_correct': False},
                {'text': f'Mock answer B for question {i} (correct)', 'is_correct': True},
                {'text': f'Mock answer C for question {i}', 'is_correct': False},
                {'text': f'Mock answer D for question {i}', 'is_correct': False},
            ]
        })
    return questions

import json
import os
import sys
import requests
from datetime import datetime

# --- Configuration for Local AI Server ---
LM_STUDIO_URL = "http://localhost:1234/v1/chat/completions"

# --- NEW: Load AI Review Prompt from external file ---
PROMPT_FILE_PATH = os.path.join('scripts', 'review_prompt_template.txt')
try:
    with open(PROMPT_FILE_PATH, 'r', encoding='utf-8') as f:
        AI_REVIEW_PROMPT = f.read()
except FileNotFoundError:
    print(f"❌ Critical Error: Prompt template file not found at '{PROMPT_FILE_PATH}'")
    sys.exit(1) # Exit if the prompt file is missing

def get_ai_review(problem):
    """
    Sends a problem to the local LLM for classification and returns the analysis.
    Includes logic to clean up and repair the AI's response.
    """
    headers = {"Content-Type": "application/json"}
    
    prompt_with_problem = AI_REVIEW_PROMPT.replace('{problem_json}', json.dumps(problem, indent=2))
    
    data = {
        "model": "local-model",
        "messages": [{"role": "user", "content": prompt_with_problem}],
        "temperature": 0.2,
    }
    
    raw_content = "" # Initialize raw_content to ensure it's available for the except block
    try:
        response = requests.post(LM_STUDIO_URL, headers=headers, json=data, timeout=90)
        response.raise_for_status()
        
        raw_content = response.json()['choices'][0]['message']['content']
        
        # --- NEW: Cleanup and Repair Logic ---
        # 1. Strip markdown and leading/trailing whitespace
        cleaned_content = raw_content.strip().replace("```json", "").replace("```", "").strip()
        
        # 2. Attempt to fix single quotes if it's not valid JSON
        try:
            ai_analysis = json.loads(cleaned_content)
        except json.JSONDecodeError:
            # The most common error is single quotes. Let's try to fix it.
            repaired_content = cleaned_content.replace("'", '"')
            ai_analysis = json.loads(repaired_content)

        return ai_analysis
        
    except (requests.exceptions.RequestException, json.JSONDecodeError, KeyError, IndexError) as e:
        print(f"\n❌ AI review failed: {e}")
        # --- NEW: Print the problematic raw content for debugging ---
        print(f"   RAW AI OUTPUT WAS: {raw_content}")
        return None

def review_and_correct_problems(file_path, full_review=False):
    """
    Main function to review and correct problems. Now with AI review capabilities.
    """
    try:
        if not os.path.exists(file_path) or os.path.getsize(file_path) == 0:
            print(f"❌ Error: File not found or is empty at '{file_path}'")
            return
            
        with open(file_path, 'r', encoding='utf-8') as f:
            problems = json.load(f)

    except Exception as e:
        print(f"❌ Error reading file: {e}")
        return

    if full_review:
        print("🚀 Full review mode enabled. All problems will be re-processed.")

    counters = {
        "reviewed": 0, "corrected": 0, "age_group_added": 0,
        "difficulty_added": 0, "duplicates": 0, "skipped": 0
    }
    seen_prompts = set()

    print(f"🔍 Starting review of {len(problems)} problems in '{file_path}'...")

    for i, problem in enumerate(problems):
        is_already_reviewed = problem.get("reviewed") == 1
        if not full_review and is_already_reviewed:
            counters["skipped"] += 1
            if problem.get('is_active', 1) == 1 and 'prompt' in problem:
                 seen_prompts.add(problem['prompt'])
            continue

        print(f"\nProcessing problem {i+1}/{len(problems)} (ID: {problem.get('id', 'N/A')})...")

        if 'age_group' not in problem or not problem.get('age_group') or full_review:
            print("   🧠 Asking AI to classify age group and difficulty...")
            ai_result = get_ai_review(problem)
            if ai_result:
                problem['age_group'] = ai_result.get('age_group', 'Needs Classification')
                problem['difficulty'] = ai_result.get('difficulty', 3)
                print(f"   🤖 AI assigned Age Group: {problem['age_group']}, Difficulty: {problem['difficulty']}")
                counters["age_group_added"] += 1
            else:
                print("   ⚠️ AI review failed. Assigning defaults.")
                problem['age_group'] = 'Needs Classification'
                problem['difficulty'] = 3
        
        is_corrected = False
        if 'data' in problem and 'options' in problem.get('data', {}) and 'answer' in problem:
            if problem['answer'] not in problem['data']['options']:
                problem['data']['options'].append(problem['answer'])
                is_corrected = True
                counters["corrected"] += 1

        prompt_text = problem.get('prompt')
        if prompt_text in seen_prompts:
            problem['is_active'] = 0
            counters["duplicates"] += 1
        else:
            problem['is_active'] = 1
            if prompt_text:
                seen_prompts.add(prompt_text)

        problem["reviewed"] = 1
        problem["reviewed_on"] = datetime.now().isoformat()
        if is_corrected:
            problem["corrected"] = 1
            
        counters["reviewed"] += 1

    try:
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(problems, f, indent=4)
    except Exception as e:
        print(f"❌ Error writing updated data to file: {e}")
        return

    print("\n--- Review Complete ---")
    print(f"✅ Reviewed {counters['reviewed']} problems.")
    if counters["duplicates"] > 0: print(f"🚫 Flagged {counters['duplicates']} duplicate problems as inactive.")
    if counters["corrected"] > 0: print(f"🔧 Corrected {counters['corrected']} problems (answer added to options).")
    if counters["age_group_added"] > 0: print(f"👤 AI assigned 'age_group' to {counters['age_group_added']} problems.")
    print(f"👍 Skipped {counters['skipped']} previously reviewed problems.")
    print(f"💾 Updated data has been saved to '{file_path}'.")

if __name__ == "__main__":
    force_full_review = len(sys.argv) > 1 and sys.argv[1] == '1'
    
    problems_file = os.path.join('public', 'problems_database.json')
    review_and_correct_problems(problems_file, full_review=force_full_review)
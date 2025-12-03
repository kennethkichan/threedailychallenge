
import json
import os
import sys
import requests
from datetime import datetime

# --- Configuration ---
LM_STUDIO_URL = "http://localhost:1234/v1/chat/completions"

# --- Define Allowed Categories for Validation ---
ALLOWED_AGE_GROUPS = {'Toddler', 'Child', 'Teen', 'High School', 'Adult'}
ALLOWED_PROBLEM_TYPES = {
    'Pattern Recognition', 'Shortcut Calculation', 'Mixed Reasoning', 
    'Sequences', 'Logical Deduction', 'Basic Sorting'
}

# --- Load Prompts from external files ---
try:
    with open(os.path.join('scripts', 'review_prompt_template.txt'), 'r', encoding='utf-8') as f:
        CLASSIFIER_PROMPT = f.read()
    with open(os.path.join('scripts', 'verifier_prompt_template.txt'), 'r', encoding='utf-8') as f:
        VERIFIER_PROMPT = f.read()
    with open(os.path.join('scripts', 'corrector_prompt_template.txt'), 'r', encoding='utf-8') as f:
        CORRECTOR_PROMPT = f.read()
except FileNotFoundError as e:
    print(f"❌ Critical Error: Prompt file not found. {e}")
    sys.exit(1)

def get_ai_response(prompt_content):
    """Generic function to send a prompt to the local LLM."""
    headers = {"Content-Type": "application/json"}
    data = {"model": "local-model", "messages": [{"role": "user", "content": prompt_content}], "temperature": 0.1}
    
    raw_content = ""
    try:
        response = requests.post(LM_STUDIO_URL, headers=headers, json=data, timeout=120)
        response.raise_for_status()
        raw_content = response.json()['choices'][0]['message']['content']
        cleaned_content = raw_content.strip().replace("```json", "").replace("```", "").strip()
        return json.loads(cleaned_content)
    except (requests.exceptions.RequestException, json.JSONDecodeError, KeyError, IndexError) as e:
        print(f"\n❌ AI call failed: {e}")
        print(f"   RAW AI OUTPUT WAS: {raw_content}")
        return None

def review_and_correct_problems(file_path, full_review=False):
    """
    Reviews problems, attempts to correct inaccurate ones, and classifies missing data.
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            problems = json.load(f)
    except Exception as e:
        print(f"❌ Error reading file: {e}")
        return

    if full_review: print("🚀 Full review mode enabled. All problems will be re-processed.")

    counters = {"processed": 0, "accurate": 0, "inaccurate": 0, "corrected": 0, "classified": 0, "skipped": 0}
    
    print(f"🔍 Starting review of {len(problems)} problems...")

    for i, problem in enumerate(problems):
        # Determine if a problem needs to be looked at
        needs_classification = (
            problem.get('age_group') not in ALLOWED_AGE_GROUPS or
            problem.get('problem_type') not in ALLOWED_PROBLEM_TYPES
        )
        needs_review = full_review or problem.get("reviewed") != 1 or needs_classification
        
        if not needs_review:
            counters["skipped"] += 1
            continue

        print(f"\nProcessing problem {i+1}/{len(problems)} (ID: {problem.get('id', 'N/A')})...")
        counters["processed"] += 1

        # --- Stage 1: Accuracy Verification ---
        print("   🧠 Verifying accuracy with AI...")
        prompt_for_verification = VERIFIER_PROMPT.replace('{problem_json}', json.dumps(problem, indent=2))
        verification = get_ai_response(prompt_for_verification)
        
        if not verification:
            print("   ⚠️ AI verification failed. Skipping problem.")
            problem['review_status'] = 'verification_failed'
            continue
            
        problem['verification_notes'] = verification.get('verification_notes', 'N/A')

        if not verification.get('is_accurate'):
            print(f"   🚫 INACCURATE: {problem['verification_notes']}")
            counters["inaccurate"] += 1

            # --- Stage 1.5: Attempt Auto-Correction ---
            print("      🤖 Attempting AI auto-correction...")
            
            prompt_for_correction = CORRECTOR_PROMPT.replace('{problem_json}', json.dumps(problem, indent=2))
            prompt_for_correction = prompt_for_correction.replace('{verification_notes}', problem['verification_notes'])
            
            corrected_problem_json = get_ai_response(prompt_for_correction)

            if corrected_problem_json:
                print("      ✅ Correction successful. Updating problem.")
                original_id = problem.get('id')
                
                problems[i] = corrected_problem_json
                problems[i]['id'] = original_id
                problems[i]['review_status'] = 'auto_corrected'
                problems[i]['reviewed'] = 1
                problems[i]['reviewed_on'] = datetime.now().isoformat()

                counters["corrected"] += 1
                counters["inaccurate"] -= 1
            else:
                print("      ⚠️ AI correction failed. Flagging for manual review.")
                problem['review_status'] = 'correction_failed'
                problem["reviewed"] = 1
                problem["reviewed_on"] = datetime.now().isoformat()
        else:
            print(f"   ✅ ACCURATE: {problem['verification_notes']}")
            problem['review_status'] = 'approved'
            counters["accurate"] += 1

            # --- Stage 2: Data Classification (only if accurate and needed) ---
            if needs_classification:
                print("   🧠 Re-classifying invalid or missing data with AI...")
                prompt_for_classification = CLASSIFIER_PROMPT.replace('{problem_json}', json.dumps(problem, indent=2))
                classification = get_ai_response(prompt_for_classification)

                if classification:
                    problem['age_group'] = classification.get('age_group', problem.get('age_group'))
                    problem['problem_type'] = classification.get('problem_type', problem.get('problem_type'))
                    problem['difficulty'] = classification.get('difficulty', problem.get('difficulty'))
                    print(f"   🤖 AI assigned Age: {problem['age_group']}, Type: {problem['problem_type']}, Diff: {problem['difficulty']}")
                    counters["classified"] += 1
                else:
                    print("   ⚠️ AI classification failed.")
            
            problem["reviewed"] = 1
            problem["reviewed_on"] = datetime.now().isoformat()

    # --- Save and Summarize ---
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(problems, f, indent=4)

    print("\n--- Review Complete ---")
    print(f"✅ Processed {counters['processed']} problems.")
    print(f"   - Found Accurate: {counters['accurate']}")
    print(f"   - Auto-corrected: {counters['corrected']}")
    print(f"   - Found Inaccurate (flagged): {counters['inaccurate']}")
    if counters["classified"] > 0: print(f"   - Re-classified data for {counters['classified']} problems.")
    print(f"👍 Skipped {counters['skipped']} previously reviewed problems.")
    print(f"💾 Updated data has been saved to '{file_path}'.")

if __name__ == "__main__":
    force_full_review = len(sys.argv) > 1 and sys.argv[1] == '1'
    problems_file = os.path.join('public', 'problems_database.json')
    review_and_correct_problems(problems_file, full_review=force_full_review)

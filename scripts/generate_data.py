import json
import requests
import os
import sys


URL = "http://localhost:1234/v1/chat/completions" # Configuration for the API request
HEADERS = {"Content-Type": "application/json"} # Configuration for the API request

# The prompt template (loaded from a separate file for cleanliness)
with open("scripts/problems_prompt_template.txt", "r") as f:
    PROMPT_TEMPLATE = f.read()

def generate_problem(age_group, skill, existing_prompts_for_category=None):
    """Generates a problem, extracts the JSON, and returns it."""
    print(f"Generating problem for: {age_group} - {skill}...")

    avoid_list = "\n".join(f"- {p}" for p in existing_prompts_for_category) if existing_prompts_for_category else "None"
    prompt = PROMPT_TEMPLATE.replace("[Age Group]", age_group).replace("[Problem Type]", skill).replace("[AVOID_LIST]", avoid_list)
    # --- Step 1: Creative Generation ---
    generation_data = {
        "model": "local-model", # This is a placeholder
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.8, # Higher temperature for more creative, reasoned output
    }

    try:
        print("   - Generating and extracting problem...")
        response = requests.post(URL, headers=HEADERS, json=generation_data)
        response.raise_for_status()  # Raise an exception for bad status codes
        raw_text = response.json()['choices'][0]['message']['content']

        # Use robust parsing to find the JSON block within the raw text.
        start_index = raw_text.find('{')
        end_index = raw_text.rfind('}') + 1
        if start_index != -1 and end_index != 0:
            json_string = raw_text[start_index:end_index]
            return json.loads(json_string)
        else:
            # This else block is now effectively unreachable if the above raises an error,
            # but we keep it as a safeguard for unexpected raw_text formats.
            print(f"   ❌ Could not find a JSON block in the model's response.")
            print(f"   RAW RESPONSE WAS: {raw_text}")
            return None

    except (requests.exceptions.RequestException, KeyError, json.JSONDecodeError) as e:
        print(f"❌ Error during generation or parsing: {e}")
        return None


def get_problem_count_from_args():
    """Gets the number of problems to generate from command-line arguments."""
    if len(sys.argv) > 1 and sys.argv[1].isdigit():
        return int(sys.argv[1])
    return 1 # Default to 1 if no valid argument is provided

def load_database(db_file_path):
    """Loads the problems database from a file, handling creation and corruption."""
    if os.path.exists(db_file_path) and os.path.getsize(db_file_path) > 0:
        with open(db_file_path, "r", encoding="utf-8") as f:
            try:
                return json.load(f)
            except json.JSONDecodeError:
                print(f"⚠️ Warning: '{db_file_path}' is corrupted. Starting fresh.")
                return []
    return []

def normalize_prompt(prompt_text):
    """Normalizes prompt text for more robust duplicate checking."""
    return ' '.join(prompt_text.lower().split())

# --- Main Execution ---
if __name__ == "__main__":
    # Create a list of tasks for the generator
    # age: 'Toddler', 'Child', 'Teen', 'High School', 'Adult'
    # skill:     'Pattern Recognition', 'Shortcut Calculation', 'Mixed Reasoning', 
    #'Sequences', 'Logical Deduction', 'Basic Sorting', 'Arithmetic',
    #'Geometry', 'Word Problems', 'Combinatorics', 'Number Theory', 'Algebra', 'Probability', 'Data Interpretation'
    # Note: The prompt template uses [Problem Type], so I've adjusted the tasks below.
    tasks = [
        {"age": "Toddler", "skill": "Word Problems"},
        {"age": "Pre-teen", "skill": "Arithmetic"},
        {"age": "Child", "skill": "Geometry"},
        {"age": "Child", "skill": "Pattern Recognition"},
        # {"age": "Child", "skill": "Basic Sorting"}
        # {"age": "High School", "skill": "Sequences"},
        # {"age": "Adult", "skill": "Logical Deduction"},
    ]

    db_file_path = "public/problems_database.json"
    all_problems = load_database(db_file_path)
    
    # --- Group existing prompts by category to encourage variation ---
    prompts_by_category = {}
    for p in all_problems:
        category_key = f"{p.get('age_group')}-{p.get('problem_type')}"
        if category_key not in prompts_by_category:
            prompts_by_category[category_key] = []
        prompts_by_category[category_key].append(p['prompt'])

    next_id = max([int(p.get('id', 0)) for p in all_problems] + [0]) + 1
    existing_prompts = {normalize_prompt(p['prompt']) for p in all_problems}

    problems_per_task = get_problem_count_from_args()
    generated_count = 0
    print(f"Generating {problems_per_task} problem(s) per task category.")

    for task in tasks:
        for _ in range(problems_per_task):
            category_key = f"{task['age']}-{task['skill']}"
            prompts_to_avoid = prompts_by_category.get(category_key, [])
            new_problem = generate_problem(task["age"], task["skill"], existing_prompts_for_category=prompts_to_avoid)
            
            prompt_text = new_problem.get('prompt') if new_problem else None
            if prompt_text and normalize_prompt(prompt_text) not in existing_prompts:
                new_problem["id"] = str(next_id)
                new_problem.update({"review_status": "pending", "reviewed": 0, "reviewed_on": None, "verification_notes": None, "disputed_on": None})
                all_problems.append(new_problem)
                existing_prompts.add(normalize_prompt(prompt_text))
                print(f"   ✅ Successfully generated and parsed problem ID {next_id}.")
                next_id += 1
                generated_count += 1
                # Add the new prompt to our category list for the next generation in this run
                if category_key not in prompts_by_category:
                    prompts_by_category[category_key] = []
                prompts_by_category[category_key].append(prompt_text)

    with open(db_file_path, "w", encoding="utf-8") as f:
        json.dump(all_problems, f, indent=4)

    print(f"\n✅ Success! Added {generated_count} new problem(s) to the database.")
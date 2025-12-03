import json
import requests
import os

# Configuration for the API request
URL = "http://localhost:1234/v1/chat/completions"
HEADERS = {"Content-Type": "application/json"}

# The prompt template (loaded from a separate file for cleanliness)
with open("scripts/problems_prompt_template.txt", "r") as f:
    PROMPT_TEMPLATE = f.read()

def generate_problem(age_group, skill):
    """Generates a single problem by calling the local LLM API."""
    print(f"Generating problem for: {age_group} - {skill}...")

    # Fill the template with the specific details
    prompt = PROMPT_TEMPLATE.replace("[Age Group]", age_group).replace("[Problem Type]", skill)

    # Data to send to the LM Studio server
    data = {
        "model": "local-model", # This is a placeholderpyth
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.7, # A bit of creativity
    }

    try:
        response = requests.post(URL, headers=HEADERS, json=data)
        response.raise_for_status() # Raise an exception for bad status codes

        # Extract the JSON content from the model's response
        raw_content = response.json()['choices'][0]['message']['content']
        problem_json = json.loads(raw_content)

        return problem_json

    except (requests.exceptions.RequestException, json.JSONDecodeError, KeyError) as e:
        print(f"❌ Error generating or parsing problem: {e}")
        print(f"   Raw response content: {raw_content}")
        return None

# --- Main Execution ---
if __name__ == "__main__":
    # Create a list of tasks for the generator
    # age: 'Toddler', 'Child', 'Teen', 'High School', 'Adult'
    # skill: 'Pattern Recognition', 'Shortcut Calculation', 'Mixed Reasoning', 'Sequences', 'Logical Deduction', 'Basic Sorting'
    # Note: The prompt template uses [Problem Type], so I've adjusted the tasks below.
    tasks = [
        {"age": "Toddler", "skill": "Pattern Recognition"},
        {"age": "Child", "skill": "Pattern Recognition"},
        # {"age": "Child", "skill": "Basic Sorting"}
        # {"age": "High School", "skill": "Sequences"},
        # {"age": "Adult", "skill": "Logical Deduction"},
    ]

    db_file = "public/problems_database.json"
    all_problems = [] # Start with an empty list by default

    # Check if the file exists AND is not empty before trying to load it
    if os.path.exists(db_file) and os.path.getsize(db_file) > 0:
        with open(db_file, "r") as f:
            try:
                all_problems = json.load(f)
            except json.JSONDecodeError:
                print(f"⚠️ Warning: '{db_file}' is corrupted or not valid JSON. Starting fresh.")
                all_problems = [] # If file is broken, start over

    # Determine the next ID to use
    if all_problems:
        # Find the highest integer ID and add 1
        max_id = max(int(p.get("id", 0)) for p in all_problems)
        next_id = max_id + 1
    else:
        next_id = 1

    # Generate a few problems for each task
    for task in tasks:
        for i in range(5): # Generate 5 problems per category
            new_problem = generate_problem(task["age"], task["skill"])
            if new_problem:
                new_problem["id"] = str(next_id) # Assign the new incremental ID
                all_problems.append(new_problem)
                next_id += 1

    # Save all problems to the final JSON database file
    with open(db_file, "w") as f:
        json.dump(all_problems, f, indent=4)

    print(f"\n✅ Success! Database updated with {len(all_problems)} total problems.")
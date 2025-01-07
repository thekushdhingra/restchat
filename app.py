import ollama
from flask import Flask, request, render_template, jsonify

app = Flask(__name__)

@app.route("/chat", methods=["POST"])
def chat():
    # Get the prompt from the request
    request_data = request.get_json()
    prompt = request_data.get("prompt")
    
    # Check if prompt is not provided and return a 400 error
    if not prompt:
        return jsonify({"error": "Prompt is required"}), 400
    
    try:
        # Get the response from the model
        response = ollama.chat(
            model="gemma:2b",
            messages=[
                {"role": "user", "content": prompt},
                {"role": "system", "content": "You are a helpful assistant. You answer in markdown, you also give code in markdown if they ask to write a programme! You also have the ability to use markdown to write stuff!"},
            ]
        )
        
        # Ensure response contains a message before returning it
        if "message" in response:
            return jsonify(response["message"]["content"])
        else:
            return jsonify({"error": "No message returned from model"}), 500
        
    except Exception as e:
        # Print and log the error for debugging
        print(f"Error: {e}")
        return jsonify({"error": "An error occurred while processing the request"}), 500

@app.route("/", methods=["GET"])
def index():
    return render_template("index.html")


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
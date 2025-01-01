function copyCodeToClipboard(event, code) {
    navigator.clipboard.writeText(code).then(() => {
        event.target.innerHTML = '<span class="copy-text">Copied</span>';
        setTimeout(() => {
            event.target.innerHTML = '<span class="copy-text">Copy</span>';
        }, 1000);
    }).catch(err => {
        console.error('Failed to copy: ', err);
    });
}
document.addEventListener("DOMContentLoaded", () => {
    const toggle = document.getElementById('theme-selector');
    const selector = document.getElementById('theme-options');
    const messagescontainer = document.getElementById('messages');
    const currentTheme = localStorage.getItem('theme');
    if (currentTheme) {
        switchTheme(currentTheme);
    } else {
        switchTheme("auto");
    }

    function processInlineMarkdown(text) {
        // Process inline markdown like **bold**, *italic*, and `code`
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
            .replace(/\*(.*?)\*/g, '<em>$1</em>')           // Italics
            .replace(/`(.*?)`/g, '<code>$1</code>');         // Inline code
    }

    function convertMarkdownToHTML(markdown) {
        let lines = markdown.split("\n");
        let htmlOutput = [];
        let inCodeBlock = false;
        let codeBlockContent = [];
        let codeLanguage = null;

        lines.forEach(line => {
            // Check if we're inside a code block
            if (line.startsWith("```")) {
                if (inCodeBlock) {
                    // Closing code block
                    htmlOutput.push(`
                        <div class="code-container">
                            <div class="code-header">
                                <span>${codeLanguage ? `${codeLanguage}` : "code"}</span>
                                <button class="copy-button" onclick="copyCodeToClipboard(event, '${escapeHtml(codeBlockContent.join("\n"))}')">
                                    <i class="fa-solid fa-copy"></i> <span class="copy-text">Copy</span>
                                </button>
                            </div>
                            <pre><code class="language-${codeLanguage}">${escapeHtml(codeBlockContent.join("\n"))}</code></pre>    
                        </div>
                    `);
                    inCodeBlock = false;
                    codeBlockContent = [];
                    codeLanguage = null;
                } else {
                    // Opening code block: check for language specification
                    const match = line.match(/^```(\w+)?/); // Match for language like ```js or just ```
                    codeLanguage = match ? match[1] : null; // Extract language or set to null if none
                    inCodeBlock = true;
                }
            } else if (inCodeBlock) {
                // Inside a code block, accumulate code lines
                codeBlockContent.push(line);
            } else {
                // Process headings
                if (line.startsWith("### ")) {
                    htmlOutput.push(`<h3>${processInlineMarkdown(line.slice(4))}</h3>`);
                } else if (line.startsWith("## ")) {
                    htmlOutput.push(`<h2>${processInlineMarkdown(line.slice(3))}</h2>`);
                } else if (line.startsWith("# ")) {
                    htmlOutput.push(`<h1>${processInlineMarkdown(line.slice(2))}</h1>`);
                } else if (line.trim() === "") {
                    htmlOutput.push(""); // Empty lines result in no output
                } else {
                    // Default to paragraphs
                    htmlOutput.push(`<p>${processInlineMarkdown(line)}</p>`);
                }
            }
        });

        // If we end with an unclosed code block, handle it
        if (inCodeBlock) {
            htmlOutput.push(`<div class="code-container">
                                <div class="code-header">
                                    <span>${codeLanguage}</span>
                                    <button class="copy-button" onclick="copyCodeToClipboard(event, '${escapeHtml(codeBlockContent.join("\n"))}')">
                                        <i class="fa-solid fa-copy"></i> Copy
                                    </button>
                                </div>
                                <pre><code class="language-${codeLanguage}">${escapeHtml(codeBlockContent.join("\n"))}</code></pre>    
                             </div>`);
        }

        // Join and return the final HTML output
        const resultHTML = htmlOutput.join("\n");

        // Apply syntax highlighting
        setTimeout(() => {
            // Re-run highlight.js on the newly inserted content
            hljs.highlightAll();
        }, 0); // Use a small delay to ensure DOM update before highlight.js runs

        return resultHTML;
    }

    // Function to escape HTML characters to avoid XSS vulnerabilities
    function escapeHtml(text) {
        return text.replace(/[&<>"']/g, (match) => {
            const escapeMap = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#039;'
            };
            return escapeMap[match];
        });
    }

    function copyCodeToClipboard(event, code) {
        navigator.clipboard.writeText(code).then(() => {
            alert('Code copied to clipboard!');
        }).catch(err => {
            console.error('Failed to copy: ', err);
        });
    }

    toggle.addEventListener('click', () => {
        selector.classList.toggle('visible');
    });

    selector.querySelectorAll(".option").forEach(option => {
        option.addEventListener('click', () => {
            switchTheme(option.getAttribute('data-value'));
        });
    });

    function switchTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        if (theme === "auto" || theme === "dark") {
            toggle.innerHTML = "<i class=\"fa-solid fa-moon\"></i>";
        } else if (theme === "light") {
            toggle.innerHTML = "<i class=\"fa-solid fa-sun\"></i>";
        }
        localStorage.setItem('theme', theme);
        selector.classList.remove('visible');
    }

    function chat() {
        const prompt = document.getElementById('prompt').value;
        const promptElement = document.createElement('div');
        promptElement.classList.add('prompt');
        promptElement.innerHTML = prompt;
        messagescontainer.appendChild(promptElement);
        messagescontainer.scrollIntoView({ behavior: 'smooth' });
        document.getElementById('prompt').value = '';

        const message = document.createElement('div');
        message.classList.add('bot');
        message.classList.add('message');
        message.innerHTML = "Thinking...";
        messagescontainer.appendChild(message);

        fetch('/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ prompt })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok.');
            }
            return response.json();
        })
        .then(data => {
            message.innerHTML = convertMarkdownToHTML(data);
        })
        .catch(error => {
            console.error('There was a problem with the fetch operation:', error.message);
        });
    }

    document.getElementById('chat-form').addEventListener('submit', function(event) {
        event.preventDefault();
        chat();
    });
});

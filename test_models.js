const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.log("No API key");
  process.exit(1);
}
fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`)
  .then(r => r.json())
  .then(data => {
    if (data.models) {
      console.log(data.models.filter(m => m.name.includes('gemma')).map(m => m.name));
    } else {
      console.log(data);
    }
  })
  .catch(console.error);

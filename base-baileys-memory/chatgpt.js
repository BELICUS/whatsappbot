const {Configuration, OpenAIApi} = require("openai");
const chat = async(prompt, text)=>{
    try{
        const configuration = new Configuration({
            apiKey: process.env.OPENAI_API_KEY,
        });
        const openai = new OpenAIApi(configuration);
        const completion = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: [
                {role: "system", content: prompt},
                {role: "user", content: text}
            ],
            n:1
        });
        return completion.data.choices[0].message;
    } catch (error) {
        console.error("Error al llamar a la API de OpenAI:", error);
        return 'error';
    }
};
module.exports = chat;

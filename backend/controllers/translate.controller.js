import axios from 'axios';

export const translateMsg = async (req, res) => {
    const { message, targetLanguage } = req.body
    console.log(message);
    console.log(targetLanguage);

    const subscriptionKey = process.env.TRANSLATOR_SUBSCRIPTION_KEY;
    const endpoint = process.env.TRANSLATOR_ENDPOINT;
    const region = process.env.TRANSLATOR_REGION;

    try {
        const response = await axios({
            method: 'POST',
            url: `${endpoint}?api-version=3.0&to=${targetLanguage}`,
            headers: {
                'Ocp-Apim-Subscription-Key': subscriptionKey,
                'Ocp-Apim-Subscription-Region': region,
                'Content-Type': 'application/json'
            },
            data: [
                { Text: message.content }
            ]
        });

        // Extract the translated text from the response
        const translatedText = response.data[0]?.translations[0]?.text;
        console.log(translatedText);


        if (!translatedText) {
            res.status(400).json({
                success: false,
                message: 'fail to translate the message'
            })
        }

        const translatedMessage = {
            ...message,
            content: translatedText
        }

        // Return translated text
        res.status(200).json({
            success: true,
            translatedMessage
        });
    } catch (error) {
        console.error("Translation error:", error);
        res.status(500).json({ error: "Translation failed" });
    }
}



export const getTranslateLangs = async (req, res) => {
    try {

        const response = await axios.get(process.env.LANGUAGE_TRANSLATOR_URL, {
            headers: {
                'Ocp-Apim-Subscription-Key': process.env.LANGUAGE_SUBSCRIPTION_KEY,
            },
        });
        const langData = response.data.translation;


         return res.status(200).json({
            success:true,
            langData
         })

    } catch (error) {
        console.error('Error fetching languages:', error);
    }
}
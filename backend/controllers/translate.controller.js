import axios from 'axios';

<<<<<<< HEAD
export const translateMsg = async (req, res) => {
    const { message, targetLanguage } = req.body
    console.log(message);
    console.log(targetLanguage);

    const subscriptionKey = process.env.TRANSLATOR_SUBSCRIPTION_KEY;
    const endpoint = process.env.TRANSLATOR_ENDPOINT;
    const region = process.env.TRANSLATOR_REGION;

    try {
=======
export const translateMsg = async (req,res) =>{
    const {message,targetLanguage} = req.body
    console.log(message);
    console.log(targetLanguage);
   
    const subscriptionKey = "56IpbygM7vdSeYPK2Rm7KtQ6XQGRrgL0TXMB4FC903FwgyCQ1FWKJQQJ99AKACGhslBXJ3w3AAAbACOGwRVX";
    const endpoint = 'https://api.cognitive.microsofttranslator.com/translate';
    const region = 'centralindia'; 

     try {
>>>>>>> 1231b23454122c208aeaebd61de14996fa854556
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

<<<<<<< HEAD
        if (!translatedText) {
            res.status(400).json({
                success: false,
                message: 'fail to translate the message'
            })
=======
        if(!translatedText){
           res.status(400).json({
            success:false,
            message:'fail to translate the message'
           })
>>>>>>> 1231b23454122c208aeaebd61de14996fa854556
        }

        const translatedMessage = {
            ...message,
<<<<<<< HEAD
            content: translatedText
        }

        // Return translated text
        res.status(200).json({
            success: true,
            translatedMessage
        });
=======
            content:translatedText
        }

        // Return translated text
        res.status(200).json({ 
            success:true,
            translatedMessage
         });
>>>>>>> 1231b23454122c208aeaebd61de14996fa854556
    } catch (error) {
        console.error("Translation error:", error);
        res.status(500).json({ error: "Translation failed" });
    }
}

<<<<<<< HEAD

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
=======
export const getListOfLanguages = async (req,res) =>{
    
>>>>>>> 1231b23454122c208aeaebd61de14996fa854556
}
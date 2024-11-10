import axios from 'axios';

export const translateMsg = async (req,res) =>{
    const {message,targetLanguage} = req.body
    console.log(message);
    console.log(targetLanguage);
   
    const subscriptionKey = "56IpbygM7vdSeYPK2Rm7KtQ6XQGRrgL0TXMB4FC903FwgyCQ1FWKJQQJ99AKACGhslBXJ3w3AAAbACOGwRVX";
    const endpoint = 'https://api.cognitive.microsofttranslator.com/translate';
    const region = 'centralindia'; 

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

        if(!translatedText){
           res.status(400).json({
            success:false,
            message:'fail to translate the message'
           })
        }

        const translatedMessage = {
            ...message,
            content:translatedText
        }

        // Return translated text
        res.status(200).json({ 
            success:true,
            translatedMessage
         });
    } catch (error) {
        console.error("Translation error:", error);
        res.status(500).json({ error: "Translation failed" });
    }
}

export const getListOfLanguages = async (req,res) =>{
    
}
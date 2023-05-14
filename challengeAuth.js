const request = require("request");

async function authenticate(tfaCode, csrf, challengeMetadata, cookie) {
    return new Promise((resolve, reject) => {
        const decodedMetadata = Buffer.from(challengeMetadata, 'base64').toString('ascii');
        const jsonDecodedMetadata = JSON.parse(decodedMetadata);

        const newChallengeId = jsonDecodedMetadata['challengeId'];
        const userId = jsonDecodedMetadata['userId'];
        const actionType = jsonDecodedMetadata['actionType'];

        request.post(`https://twostepverification.roblox.com/v1/users/${userId}/challenges/authenticator/verify`, {
            headers: {
                'content-type': 'application/json',
                'cookie': '.ROBLOSECURITY=' + cookie,
                'x-csrf-token': csrf
            },
            body: JSON.stringify({
                actionType: actionType,
                challengeId: newChallengeId,
                code: tfaCode
            })
        }, (error, response, body) => {
            if (error) {
                return reject(error);
            }

            if (response.statusCode == 200) {
                const jsonBody = JSON.parse(body);
                const verificationToken = jsonBody['verificationToken'];

                const jsonToEncode = JSON.stringify({
                    verificationToken: verificationToken,
                    rememberDevice: false,
                    challengeId: newChallengeId,
                    actionType: actionType
                });

                const encodedData = Buffer.from(jsonToEncode).toString('base64');
                return resolve(encodedData);
            } else {
                return reject(response.body);
            }
        });
    });
}

module.exports = { authenticate };

/*
Example usage:
try {
    const encodedData = await authenticate(2facode, csrftoken, challengeMetadata, cookie)
    // retry request using 'encodedData' as the 'rblx-challenge-metadata' header, the original challengeId as the 'rblx-challenge-id' header, and the challengeType as 'rblx-challenge-type', usually is just "Generic".
} catch (err) {
    console.log(err)
}
*/

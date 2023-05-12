const request = require("request");

async function authenticate(tfaCode, csrf, challengeMetadata, cookie) {
    return new Promise((resolve, reject) => {
        // roblox hides the real challengeId within the challenge metadata
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

                // to include within the headers of the new request
                const encodedData = Buffer.from(jsonToEncode).toString('base64');
                resolve(encodedData);
            } else {
                reject(response.body);
            }
        });
    });
}

module.exports = { authenticate };


let addon

function init(addonToSave) {
    addon = addonToSave
}

function createPage(clientKey, pageData) {
    const httpClient = addon.httpClient({
        clientKey  // The unique client key of the tenant to make a request to
      });

    var options = {
        uri: '/rest/api/content',
        json: pageData
    };

    httpClient.post(options, function(err, res, body) {
        console.log('maybe it worked', err, body)
    });
}

function getSpaces(clientKey) {
    return new Promise((resolve, reject) => {
        const httpClient = addon.httpClient({
            clientKey  // The unique client key of the tenant to make a request to
          });
    
        httpClient.get('/rest/api/space', function(err, res, body) {
            if (err != null) {
                reject(err)
                return
            }

            const parsedBody = JSON.parse(body)
            resolve(parsedBody.results)
        })
    })
}

module.exports = {
    init,
    createPage,
    getSpaces
}
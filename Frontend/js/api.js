const API_URL = "http://localhost:8083";
const TOKEN_KEY = "u3_access_token";

// Realizar peticiones al API Gateway
async function callApi(path, { useToken = true } = {}) {
    const headers = {};
    const token = sessionStorage.getItem(TOKEN_KEY);

    // Enviar el token Bearer cuando esté disponible
    if (useToken && token) {
        headers["Authorization"] = "Bearer " + token;
    }

    try {
        const response = await fetch(API_URL + path, {
            method: "GET",
            headers: headers
        });

        const text = await response.text();

        let data = null;

        try {
            data = text ? JSON.parse(text) : null;
        } catch {
            data = text;
        }

        return {
            status: response.status,
            ok: response.ok,
            data: data,
            sentToken: useToken && !!token
        };

    } catch (error) {
        throw new Error(
            "No se pudo conectar con el Gateway: " + error.message
        );
    }
}

// Hacer disponible la función para index.html
window.callApi = callApi;

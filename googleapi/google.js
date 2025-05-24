import { google } from "googleapis";
import { config } from "dotenv";
import dotenv from 'dotenv';

config();
dotenv.config();

const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);

const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

async function getSheetId(sheetName, sheets, spreadsheetId) {
    // Obtener las propiedades del documento de Google Sheets (todos los sheets)
    const response = await sheets.spreadsheets.get({
        spreadsheetId,
    });

    // Buscar el ID de la hoja por nombre
    const sheet = response.data.sheets.find(sheet => sheet.properties.title === sheetName);

    if (!sheet) {
        throw new Error(`No se encontró la hoja con nombre ${sheetName}`);
    }

    return sheet.properties.sheetId;
};

export const appendToSheet = async (sheetName, values, formatRules = {}) => {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: "v4", auth: client });

    const spreadsheetId = process.env.SPREADSHEET_ID;

    try {
        // 1. Guardar los datos en Google Sheets
        const appendResponse = await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: `${sheetName}`,
            valueInputOption: "RAW",
            insertDataOption: "INSERT_ROWS",
            resource: { values },
        });

        // console.log(`✅ Datos agregados a la hoja '${sheetName}':`, values);
        // 2. Obtener la fila donde se insertaron los datos
        const updatedRange = appendResponse.data.updates.updatedRange;
        const startRow = parseInt(updatedRange.match(/\d+/)[0]); // Extrae la fila

        // 3. Obtener el ID de la hoja dentro del spreadsheet
        const sheetId = await getSheetId(sheetName, sheets, spreadsheetId);

        // 4. Construir las reglas de formato
        const requests = [];
        for (const [columnLetter, format] of Object.entries(formatRules)) {
            const columnIndex = columnLetter.charCodeAt(0) - 65; // Convierte "C" → 2, "D" → 3, etc.

            // Añadir el formato a la solicitud
            requests.push({
                repeatCell: {
                    range: {
                        sheetId: sheetId,
                        startRowIndex: startRow - 1, // Ajustar fila al índice 0
                        endRowIndex: startRow,
                        startColumnIndex: columnIndex,
                        endColumnIndex: columnIndex + 1,
                    },
                    cell: {
                        userEnteredFormat: format,
                    },
                    fields: "userEnteredFormat.numberFormat",
                },
            });
        }

        // 5. Aplicar los formatos
        if (requests.length > 0) {
            await sheets.spreadsheets.batchUpdate({
                spreadsheetId,
                resource: { requests },
            });
            console.log("✅ Formatos aplicados correctamente");
        }
        return startRow;

    } catch (error) {
        console.error("❌ Error al escribir en Google Sheets:", error);
        throw error;
    }
};

export const modifyRow = async (sheetName, row, newValues) => {
    try {
        const client = await auth.getClient();
        const sheets = google.sheets({ version: "v4", auth: client });

        const spreadsheetId = process.env.SPREADSHEET_ID;
        const range = `${sheetName}!K${row}:K${row}`;
        const googleResponse = await sheets.spreadsheets.values.update({
            spreadsheetId,
            range,
            valueInputOption: "RAW",
            resource: { values: [newValues] }
        });
        return googleResponse
    } catch (error) {
        console.error("❌ Error al escribir en Google Sheets:", error);
        throw error;
    }

}





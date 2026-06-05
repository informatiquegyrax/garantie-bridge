exports.handler = async function (event) {
  const TABLE_ID = process.env.BASEROW_TABLE_ID;
  const API_KEY  = process.env.BASEROW_API_KEY;

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  // Diagnostic : si les variables manquent, on le dit clairement
  if (!TABLE_ID || !API_KEY) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Variables environnement manquantes',
        TABLE_ID_present: !!TABLE_ID,
        API_KEY_present:  !!API_KEY,
      }),
    };
  }

  const rowId = event.queryStringParameters && event.queryStringParameters.row_id;

  if (!rowId) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Paramètre row_id manquant.' }),
    };
  }

  try {
    const resp = await fetch(
      `https://api.baserow.io/api/database/rows/table/${TABLE_ID}/${rowId}/?user_field_names=true`,
      { headers: { Authorization: `Token ${API_KEY}` } }
    );

    if (resp.status === 404) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: `Aucune machine trouvée pour l'ID ${rowId}.` }),
      };
    }

    if (!resp.ok) {
      throw new Error(`Erreur Baserow : ${resp.status}`);
    }

    const row = await resp.json();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        num_serie:    row['NUM_SERIE'] || '',
        type_machine: row['LIB']      || '',
        date_fab:     row['DATE_FAB'] || '',
      }),
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
};

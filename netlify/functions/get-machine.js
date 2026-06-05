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

    // LOG DE SÉCURITÉ : Permet de voir la structure exacte reçue dans votre console (Netlify / Cloudflare logs)
    console.log("DONNÉES BRUTES DE BASEROW :", JSON.stringify(row));

    // Sécurité pour le numéro de série (si c'est un champ Lien/Relation ou du texte brut)
    const numSerieRaw = row['NUM_SERIE'];
    const finalNumSerie = Array.isArray(numSerieRaw) && numSerieRaw.length > 0 
      ? numSerieRaw[0].value 
      : (numSerieRaw || '');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        num_serie:    finalNumSerie,
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

exports.handler = async function (event) {
  // TABLE_ID doit être l'ID de votre table "Numéro de série" (celle où se trouvent toutes les machines)
  const TABLE_ID = process.env.BASEROW_TABLE_ID; 
  const API_KEY  = process.env.BASEROW_API_KEY;

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  if (!TABLE_ID || !API_KEY) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Variables environnement manquantes' }),
    };
  }

  // On récupère le numéro de série saisi passé dans l'URL (ex: ?num_serie_saisie=SN12345)
  const numSerieSaisie = event.queryStringParameters && event.queryStringParameters.num_serie_saisie;

  if (!numSerieSaisie) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Paramètre 'num_serie_saisie' manquant dans l'URL." }),
    };
  }

  try {
    // On appelle l'API Baserow en utilisant un filtre d'égalité exacte sur la colonne NUM_SERIE
    // filter__field_NUM_SERIE__equal=... cherche la correspondance parfaite
    const url = `https://api.baserow.io/api/database/rows/table/${TABLE_ID}/?user_field_names=true&filter__field_NUM_SERIE__equal=${encodeURIComponent(numSerieSaisie)}`;
    
    const resp = await fetch(url, { 
      headers: { Authorization: `Token ${API_KEY}` } 
    });

    if (!resp.ok) {
      throw new Error(`Erreur Baserow : ${resp.status}`);
    }

    const data = await resp.json();

    // Baserow renvoie une liste de résultats dans un tableau "results"
    if (!data.results || data.results.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: `Aucune machine trouvée pour le numéro de série : ${numSerieSaisie}` }),
      };
    }

    // On prend la première machine correspondante trouvée
    const row = data.results[0];

    // LOG DE SÉCURITÉ : Permet de voir la structure exacte de la machine trouvée dans vos logs Netlify
    console.log("MACHINE TROUVÉE :", JSON.stringify(row));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        num_serie:    row['NUM_SERIE'] || numSerieSaisie, // On renvoie le numéro de série valide
        type_machine: row['LIB']       || '',
        date_fab:     row['DATE_FAB']  || '',
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

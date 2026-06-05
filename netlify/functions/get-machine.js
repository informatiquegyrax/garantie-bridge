exports.handler = async function (event) {

  const FORM_TABLE_ID = process.env.BASEROW_FORM_TABLE_ID;
  const MACHINE_TABLE_ID = process.env.BASEROW_TABLE_ID;
  const API_KEY = process.env.BASEROW_API_KEY;

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  const rowId = event.queryStringParameters?.row_id;

  if (!rowId) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'row_id manquant' }),
    };
  }

  try {

    // 1. Lecture de la ligne créée par le formulaire
    const formResp = await fetch(
      `https://api.baserow.io/api/database/rows/table/${FORM_TABLE_ID}/${rowId}/?user_field_names=true`,
      {
        headers: {
          Authorization: `Token ${API_KEY}`
        }
      }
    );

    const formRow = await formResp.json();

    const numSerie = formRow.NUM_SERIE;

    if (!numSerie) {
      throw new Error('NUM_SERIE vide');
    }

    // 2. Recherche dans la table des machines
    const searchResp = await fetch(
      `https://api.baserow.io/api/database/rows/table/${MACHINE_TABLE_ID}/?user_field_names=true&search=${encodeURIComponent(numSerie)}`,
      {
        headers: {
          Authorization: `Token ${API_KEY}`
        }
      }
    );

    const searchData = await searchResp.json();

    if (!searchData.results.length) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          error: `Aucune machine trouvée pour ${numSerie}`
        })
      };
    }

    const machine = searchData.results[0];

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        num_serie: machine.NUM_SERIE,
        type_machine: machine.LIB,
        date_fab: machine.DATE_FAB
      })
    };

  } catch (err) {

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: err.message
      })
    };

  }
};

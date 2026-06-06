exports.handler = async function (event) {
  const TABLE_FORM    = process.env.BASEROW_TABLE_FORM;    // 1012921
  const TABLE_MACHINE = process.env.BASEROW_TABLE_ID;      // 1005893
  const API_KEY       = process.env.BASEROW_API_KEY;

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  if (!TABLE_FORM || !TABLE_MACHINE || !API_KEY) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Variables environnement manquantes',
        TABLE_FORM_present: !!TABLE_FORM,
        TABLE_MACHINE_present: !!TABLE_MACHINE,
        API_KEY_present: !!API_KEY,
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
    // Étape 1 : récupérer le NUM_SERIE depuis la table du formulaire
    const formResp = await fetch(
      `https://api.baserow.io/api/database/rows/table/${TABLE_FORM}/${rowId}/?user_field_names=true`,
      { headers: { Authorization: `Token ${API_KEY}` } }
    );

    if (formResp.status === 404) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: `Aucune ligne trouvée pour l'ID ${rowId} dans la table formulaire.` }),
      };
    }

    if (!formResp.ok) {
      throw new Error(`Erreur Baserow (table formulaire) : ${formResp.status}`);
    }

    const formRow = await formResp.json();
    const numSerie = formRow['NUM_SERIE'];

    if (!numSerie) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'NUM_SERIE absent de la ligne du formulaire.' }),
      };
    }

    // Étape 2 : chercher la machine dans la table machines par NUM_SERIE
    const filter = `filter__NUM_SERIE__equal=${encodeURIComponent(numSerie)}`;
    const machineResp = await fetch(
      `https://api.baserow.io/api/database/rows/table/${TABLE_MACHINE}/?${filter}&user_field_names=true`,
      { headers: { Authorization: `Token ${API_KEY}` } }
    );

    if (!machineResp.ok) {
      throw new Error(`Erreur Baserow (table machines) : ${machineResp.status}`);
    }

    const machineData = await machineResp.json();

    if (!machineData.results || machineData.results.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          error: `Aucune machine trouvée avec le numéro de série "${numSerie}".`,
        }),
      };
    }

    const machineRow = machineData.results[0];

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        num_serie:    numSerie,
        type_machine: machineRow['LIB']      || '',
        date_fab:     machineRow['DATE_FAB'] || '',
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

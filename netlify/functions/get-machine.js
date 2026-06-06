exports.handler = async function (event) {
  const TABLE_FORM    = process.env.BASEROW_TABLE_FORM;
  const TABLE_MACHINE = process.env.BASEROW_TABLE_ID;
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
        error: 'Variables manquantes',
        TABLE_FORM: !!TABLE_FORM,
        TABLE_MACHINE: !!TABLE_MACHINE,
        API_KEY: !!API_KEY,
      }),
    };
  }

  const rowId = event.queryStringParameters?.row_id;

  if (!rowId) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'row_id manquant' }),
    };
  }

  try {
    const formResp = await fetch(
      `https://api.baserow.io/api/database/rows/table/${TABLE_FORM}/${rowId}/?user_field_names=true`,
      { headers: { Authorization: `Token ${API_KEY}` } }
    );

    if (!formResp.ok) {
      throw new Error(`Erreur Baserow: ${formResp.status}`);
    }

    const formRow = await formResp.json();
    const numSerie = formRow.NUM_SERIE;

    if (!numSerie) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'NUM_SERIE absent', row: formRow }),
      };
    }

    const machineResp = await fetch(
      `https://api.baserow.io/api/database/rows/table/${TABLE_MACHINE}/?filter__NUM_SERIE__equal=${encodeURIComponent(numSerie)}&user_field_names=true`,
      { headers: { Authorization: `Token ${API_KEY}` } }
    );

    if (!machineResp.ok) {
      throw new Error(`Erreur Baserow: ${machineResp.status}`);
    }

    const machineData = await machineResp.json();

    if (!machineData.results?.length) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: `Machine non trouvée: ${numSerie}` }),
      };
    }

    const machine = machineData.results[0];

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        num_serie: numSerie,
        type_machine: machine.LIB || '',
        date_fab: machine.DATE_FAB || '',
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

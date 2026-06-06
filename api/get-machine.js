export default async (req, res) => {
  const TABLE_FORM    = process.env.BASEROW_TABLE_FORM;
  const TABLE_MACHINE = process.env.BASEROW_TABLE_ID;
  const API_KEY       = process.env.BASEROW_API_KEY;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  if (!TABLE_FORM || !TABLE_MACHINE || !API_KEY) {
    return res.status(500).json({
      error: 'Variables manquantes',
      TABLE_FORM: !!TABLE_FORM,
      TABLE_MACHINE: !!TABLE_MACHINE,
      API_KEY: !!API_KEY,
    });
  }

  const { row_id } = req.query;

  if (!row_id) {
    return res.status(400).json({ error: 'row_id manquant' });
  }

  try {
    const formResp = await fetch(
      `https://api.baserow.io/api/database/rows/table/${TABLE_FORM}/${row_id}/?user_field_names=true`,
      { headers: { Authorization: `Token ${API_KEY}` } }
    );

    if (!formResp.ok) {
      throw new Error(`Erreur Baserow: ${formResp.status}`);
    }

    const formRow = await formResp.json();
    const numSerie = formRow.NUM_SERIE;

    if (!numSerie) {
      return res.status(400).json({ error: 'NUM_SERIE absent' });
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
      return res.status(404).json({ error: `Machine non trouvée: ${numSerie}` });
    }

    const machine = machineData.results[0];

    // Extraire seulement la date (avant l'espace et l'heure)
const dateFab = machine.DATE_FAB ? machine.DATE_FAB.split(' ')[0] : '';

return res.status(200).json({
  num_serie: numSerie,
  type_machine: machine.LIB || '',
  date_fab: dateFab,
});

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

<script>
document.addEventListener("DOMContentLoaded", function () {
    // 1. Récupération des paramètres présents dans l'URL de la page
    const urlParams = new URLSearchParams(window.location.search);
    const numSerieSaisie = urlParams.get('num_serie_saisie');

    // Sécurité : Si le paramètre n'est pas présent, on arrête le script proprement
    if (!numSerieSaisie) {
        console.log("En attente de la soumission du premier formulaire (num_serie_saisie manquant).");
        return;
    }

    // 2. Appel de votre fonction Netlify avec le numéro de série récupéré
    // (Le chemin relatif fonctionne parfaitement puisque la fonction et le site partagent le même domaine Netlify)
    const netlifyFunctionUrl = `/.netlify/functions/votre-nom-de-fichier-fonction?num_serie_saisie=${encodeURIComponent(numSerieSaisie)}`;

    fetch(netlifyFunctionUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erreur réseau lors de l'appel de la fonction (${response.status})`);
            }
            return response.json();
        })
        .then(data => {
            // Si la fonction retourne une erreur (ex: machine non trouvée dans Baserow)
            if (data.error) {
                console.error("Machine introuvable :", data.error);
                alert(`Avis : ${data.error}`);
                return;
            }

            // 3. OPTION A : Si votre 2ème formulaire est intégré via un IFRAME Baserow
            // On reconstruit l'URL de l'iframe en lui injectant les valeurs de pré-remplissage (?prefill_FIELD=VALUE)
            const iframe = document.getElementById('votre-iframe-formulaire-2'); 
            if (iframe) {
                const baserowFormUrl = "https://baserow.io/form/VOTRE_ID_DE_FORMULAIRE";
                
                // On associe les données de la fonction Netlify aux champs attendus par le formulaire Baserow
                iframe.src = `${baserowFormUrl}?prefill_NUM_SERIE=${encodeURIComponent(data.num_serie)}&prefill_TYPE_MACHINE=${encodeURIComponent(data.type_machine)}&prefill_DATE_FAB=${encodeURIComponent(data.date_fab)}`;
                console.log("Iframe Baserow pré-rempli avec succès !");
            }

            /* // 4. OPTION B : Si vous utilisez des champs HTML classiques au lieu d'un iframe,
            // décommentez les lignes ci-dessous et ajustez les IDs :
            
            document.getElementById('champ_num_serie').value = data.num_serie;
            document.getElementById('champ_type_machine').value = data.type_machine;
            document.getElementById('champ_date_fab').value = data.date_fab;
            */
        })
        .catch(error => {
            console.error("Erreur globale lors de la récupération des données :", error);
        });
});
</script>

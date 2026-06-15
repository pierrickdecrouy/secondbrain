import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

export function startTutorial(force = false) {
    // Check if the user already dismissed or finished the tutorial
    const isDismissed = localStorage.getItem('pharmabrain_tutorial_dismissed') === 'true';
    if (isDismissed && !force) {
        return;
    }

    const driverObj = driver({
        showProgress: true,
        animate: true,
        allowClose: true,
        nextBtnText: 'Suivant',
        prevBtnText: 'Précédent',
        doneBtnText: 'Terminer',
        progressText: '{{current}} / {{total}}',
        onDestroyStarted: () => {
            if (!driverObj.hasNextStep() || confirm("Voulez-vous ignorer le reste du tutoriel ? (Vous pourrez le relancer depuis les paramètres)")) {
                localStorage.setItem('pharmabrain_tutorial_dismissed', 'true');
                driverObj.destroy();
            }
        },
        steps: [
            {
                popover: {
                    title: 'Bienvenue sur Pharmabrain',
                    description: 'Prenez en main les outils essentiels pour structurer et réviser vos connaissances médicales.',
                    side: 'over',
                    align: 'center'
                }
            },
            {
                element: '.search-omnibox',
                popover: {
                    title: 'Recherche Globale',
                    description: 'Utilisez le raccourci Cmd+K (ou Ctrl+K) n\'importe où pour trouver instantanément une fiche, une pathologie ou une DCI.',
                    side: 'bottom',
                    align: 'center'
                }
            },
            {
                element: '#tour-nav-dashboard',
                popover: {
                    title: 'Vue d\'ensemble',
                    description: 'Suivez vos statistiques d\'apprentissage, reprenez vos brouillons en cours et lancez vos révisions quotidiennes.',
                    side: 'right',
                    align: 'start'
                }
            },
            {
                element: '#tour-nav-cards',
                popover: {
                    title: 'Base de Connaissances',
                    description: 'Accédez à l\'intégralité de vos fiches. Utilisez les filtres par catégorie ou les étiquettes pour organiser vos informations.',
                    side: 'right',
                    align: 'start'
                }
            },
            {
                element: '#tour-nav-courses',
                popover: {
                    title: 'Fiches de Cours',
                    description: 'Assemblez plusieurs fiches individuelles pour structurer un cours thématique ou un protocole complet.',
                    side: 'right',
                    align: 'start'
                }
            },
            {
                element: '#tour-nav-network',
                popover: {
                    title: 'Graphe Mental',
                    description: 'Explorez les connexions sémantiques entre vos fiches. Les liens sont suggérés automatiquement pour faciliter la réflexion clinique.',
                    side: 'right',
                    align: 'start'
                }
            },
            {
                element: '#tour-nav-review',
                popover: {
                    title: 'Sessions de Révision',
                    description: 'Révisez vos fiches au moment optimal grâce à l\'algorithme de répétition espacée FSRS, conçu pour la mémorisation à long terme.',
                    side: 'right',
                    align: 'start'
                }
            },
            {
                popover: {
                    title: 'Tutoriel terminé',
                    description: 'Vous pouvez relancer ce guide à tout moment depuis les paramètres. Créez votre première fiche pour commencer.',
                    side: 'over',
                    align: 'center'
                }
            }
        ]
    });

    driverObj.drive();
}

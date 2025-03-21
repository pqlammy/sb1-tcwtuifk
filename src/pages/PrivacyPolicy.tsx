import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 to-black py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-300 hover:text-white mb-8"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </button>

        <div className="bg-white/10 backdrop-blur-lg rounded-lg p-8">
          <h1 className="text-3xl font-bold text-white mb-8">Datenschutzerklärung</h1>

          <div className="prose prose-invert max-w-none">
            <h2>1. Einleitung</h2>
            <p>
              Mit dieser Datenschutzerklärung informieren wir Sie über die Verarbeitung
              personenbezogener Daten bei der Nutzung unserer Website.
            </p>

            <h2>2. Verantwortliche Stelle</h2>
            <p>
              Verantwortlich für die Datenverarbeitung auf dieser Website ist:
              <br />
              Genner Gibelguuger
              <br />
              [Adresse]
              <br />
              [Kontaktdaten]
            </p>

            <h2>3. Erhebung und Verarbeitung personenbezogener Daten</h2>
            <p>
              Wir erheben personenbezogene Daten, wenn Sie diese im Rahmen Ihrer
              Beitragserfassung oder Registrierung angeben. Dies umfasst:
            </p>
            <ul>
              <li>Name und Vorname</li>
              <li>E-Mail-Adresse</li>
              <li>Postanschrift</li>
              <li>Beitragsdaten</li>
            </ul>

            <h2>4. Zweck der Datenverarbeitung</h2>
            <p>
              Wir verarbeiten Ihre personenbezogenen Daten für folgende Zwecke:
            </p>
            <ul>
              <li>Zur Erfüllung des Beitragseinzugs</li>
              <li>Zur Kommunikation mit Ihnen</li>
              <li>Zur Verwaltung Ihrer Mitgliedschaft</li>
            </ul>

            <h2>5. Datensicherheit</h2>
            <p>
              Wir setzen technische und organisatorische Sicherheitsmassnahmen ein,
              um Ihre personenbezogenen Daten gegen zufällige oder vorsätzliche
              Manipulationen, Verlust, Zerstörung oder gegen den Zugriff
              unberechtigter Personen zu schützen.
            </p>

            <h2>6. Ihre Rechte</h2>
            <p>
              Sie haben das Recht auf:
            </p>
            <ul>
              <li>Auskunft über Ihre gespeicherten personenbezogenen Daten</li>
              <li>Berichtigung unrichtiger personenbezogener Daten</li>
              <li>Löschung Ihrer personenbezogenen Daten</li>
              <li>Einschränkung der Datenverarbeitung</li>
              <li>Datenübertragbarkeit</li>
              <li>Widerspruch gegen die Datenverarbeitung</li>
            </ul>

            <h2>7. Kontakt</h2>
            <p>
              Bei Fragen zur Erhebung, Verarbeitung oder Nutzung Ihrer
              personenbezogenen Daten können Sie sich jederzeit an uns wenden.
            </p>

            <h2>8. Änderungen</h2>
            <p>
              Wir behalten uns vor, diese Datenschutzerklärung anzupassen, damit
              sie stets den aktuellen rechtlichen Anforderungen entspricht oder um
              Änderungen unserer Leistungen in der Datenschutzerklärung umzusetzen.
            </p>

            <p className="mt-8 text-sm text-gray-400">
              Stand: März 2025
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
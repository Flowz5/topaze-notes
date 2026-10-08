export const structureBtsSio = [
  {
    folder: 'Langages',
    subfolders: [
      { 
        name: 'Python', 
        note: `<h1>Bases de Python</h1>
<h2>Variables et Types</h2>
<pre><code># Les types de base
age = 20          # int
taille = 1.80     # float
nom = "Alice"     # str
est_etudiant = True # bool
</code></pre>
<h2>Boucles et Conditions</h2>
<pre><code>if age >= 18:
    print("Majeur")
else:
    print("Mineur")

for i in range(5):
    print(i) # 0 à 4
</code></pre>
<h2>Fonctions</h2>
<pre><code>def saluer(nom: str) -> str:
    return f"Bonjour {nom}"
</code></pre>
<h2>Programmation Orientée Objet</h2>
<pre><code>class Personne:
    def __init__(self, nom):
        self.nom = nom
    
    def se_presenter(self):
        return f"Je suis {self.nom}"
</code></pre>`
      },
      { 
        name: 'Bash', 
        note: `<h1>Scripts Bash</h1>
<h2>Variables</h2>
<pre><code>#!/bin/bash
NOM="Bob"
echo "Bonjour $NOM"
</code></pre>
<h2>Conditions</h2>
<pre><code>if [ "$NOM" == "Bob" ]; then
    echo "C'est Bob"
else
    echo "Inconnu"
fi
</code></pre>
<h2>Boucles</h2>
<pre><code>for fichier in *.txt; do
    echo "Fichier trouvé: $fichier"
done
</code></pre>`
      },
      { 
        name: 'Java', 
        note: `<h1>Bases de Java</h1>
<h2>Classes et Variables</h2>
<pre><code>public class Main {
    public static void main(String[] args) {
        int age = 20;
        String nom = "Charlie";
        System.out.println("Bonjour " + nom);
    }
}
</code></pre>
<h2>Héritage et Interfaces</h2>
<pre><code>interface Volant {
    void voler();
}

class Oiseau implements Volant {
    @Override
    public void voler() {
        System.out.println("L'oiseau vole");
    }
}
</code></pre>`
      },
      { 
        name: 'Kotlin', 
        note: `<h1>Syntaxe Kotlin</h1>
<h2>Variables et Null Safety</h2>
<pre><code>val immuable = "Fixe"
var modifiable = "Changeable"

// Null safety
var nom: String? = null
println(nom?.length) // Affiche null sans crasher
</code></pre>
<h2>Data Classes</h2>
<pre><code>data class Utilisateur(val id: Int, val nom: String)
val user = Utilisateur(1, "Alice")
</code></pre>`
      },
      { 
        name: 'HTML', 
        note: `<h1>Structure HTML5</h1>
<h2>Base d'une page</h2>
<pre><code>&lt;!DOCTYPE html&gt;
&lt;html lang="fr"&gt;
&lt;head&gt;
    &lt;meta charset="UTF-8"&gt;
    &lt;title&gt;Mon Site&lt;/title&gt;
&lt;/head&gt;
&lt;body&gt;
    &lt;header&gt;
        &lt;h1&gt;Bienvenue&lt;/h1&gt;
    &lt;/header&gt;
    &lt;main&gt;
        &lt;section&gt;
            &lt;p&gt;Contenu principal&lt;/p&gt;
        &lt;/section&gt;
    &lt;/main&gt;
&lt;/body&gt;
&lt;/html&gt;
</code></pre>
<h2>Formulaires</h2>
<pre><code>&lt;form action="/login" method="POST"&gt;
    &lt;label for="email"&gt;Email&lt;/label&gt;
    &lt;input type="email" id="email" name="email" required&gt;
    &lt;button type="submit"&gt;Envoyer&lt;/button&gt;
&lt;/form&gt;
</code></pre>`
      },
      { 
        name: 'CSS', 
        note: `<h1>CSS Avancé</h1>
<h2>Sélecteurs</h2>
<pre><code>/* Classes et IDs */
.ma-classe { color: red; }
#mon-id { background: blue; }

/* Pseudo-classes */
a:hover { text-decoration: underline; }
li:nth-child(even) { background: #eee; }
</code></pre>
<h2>Flexbox</h2>
<pre><code>.container {
    display: flex;
    justify-content: center; /* Centre horizontalement */
    align-items: center; /* Centre verticalement */
    flex-direction: column;
}
</code></pre>
<h2>Grid</h2>
<pre><code>.grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
}
</code></pre>`
      },
      { 
        name: 'JS', 
        note: `<h1>JavaScript ES6+</h1>
<h2>Manipulation du DOM</h2>
<pre><code>const bouton = document.querySelector('#mon-bouton');
bouton.addEventListener('click', () => {
    alert('Cliqué !');
});
</code></pre>
<h2>Promesses et Fetch</h2>
<pre><code>async function recupererDonnees() {
    try {
        const reponse = await fetch('https://api.exemple.com/data');
        const data = await reponse.json();
        console.log(data);
    } catch (erreur) {
        console.error('Erreur:', erreur);
    }
}
</code></pre>`
      },
      { 
        name: 'PHP', 
        note: `<h1>Bases de PHP</h1>
<h2>Variables et Sessions</h2>
<pre><code>&lt;?php
session_start();
$nom = "Alice";
$_SESSION['utilisateur'] = $nom;
echo "Bonjour " . $nom;
?&gt;
</code></pre>
<h2>Base de données (PDO)</h2>
<pre><code>&lt;?php
$pdo = new PDO('mysql:host=localhost;dbname=test', 'root', '');
$stmt = $pdo->prepare('SELECT * FROM users WHERE age > ?');
$stmt->execute([18]);
$users = $stmt->fetchAll(PDO::FETCH_ASSOC);
?&gt;
</code></pre>`
      }
    ]
  },
  {
    folder: 'Frameworks',
    subfolders: [
      { 
        name: 'Symfony', 
        note: `<h1>Symfony</h1>
<h2>Contrôleur et Routage</h2>
<pre><code>class DefaultController extends AbstractController
{
    #[Route('/hello/{nom}', name: 'hello')]
    public function index(string $nom): Response
    {
        return $this->render('hello.html.twig', [
            'nom' => $nom,
        ]);
    }
}
</code></pre>
<h2>Doctrine (ORM)</h2>
<pre><code>$entityManager = $this->getDoctrine()->getManager();
$user = new User();
$user->setName('Bob');
$entityManager->persist($user);
$entityManager->flush();
</code></pre>`
      },
      { 
        name: 'Bootstrap', 
        note: `<h1>Bootstrap 5</h1>
<h2>Grille Responsive</h2>
<pre><code>&lt;div class="container"&gt;
    &lt;div class="row"&gt;
        &lt;div class="col-md-6 col-12"&gt;Moitié sur PC, Totalité sur Mobile&lt;/div&gt;
        &lt;div class="col-md-6 col-12"&gt;Autre moitié&lt;/div&gt;
    &lt;/div&gt;
&lt;/div&gt;
</code></pre>
<h2>Composants Utiles</h2>
<pre><code>&lt;button class="btn btn-primary"&gt;Bouton Bleu&lt;/button&gt;
&lt;div class="alert alert-danger"&gt;Erreur !&lt;/div&gt;
</code></pre>`
      }
    ]
  },
  {
    folder: 'Linux',
    subfolders: [
      { 
        name: 'Commandes', 
        note: `<h1>Commandes Linux Essentielles</h1>
<h2>Navigation et Fichiers</h2>
<ul>
<li><code>ls -la</code> : Liste tous les fichiers (détails + cachés)</li>
<li><code>cd /var/www</code> : Naviguer vers un dossier</li>
<li><code>grep "erreur" app.log</code> : Chercher un mot dans un fichier</li>
<li><code>find . -name "*.php"</code> : Trouver des fichiers PHP</li>
</ul>
<h2>Permissions</h2>
<ul>
<li><code>chmod 755 script.sh</code> : Donner les droits d'exécution</li>
<li><code>chown www-data:www-data dossier</code> : Changer le propriétaire</li>
</ul>
<h2>Archives</h2>
<ul>
<li><code>tar -czvf archive.tar.gz dossier/</code> : Créer une archive</li>
<li><code>tar -xzvf archive.tar.gz</code> : Extraire une archive</li>
</ul>`
      }
    ]
  },
  {
    folder: 'Système',
    subfolders: [
      { 
        name: 'Processus', 
        note: `<h1>Processus et Threads</h1>
<h2>Définitions</h2>
<p>Un processus est un programme en cours d'exécution. Il possède son propre espace mémoire isolé.</p>
<p>Un thread (fil d'exécution) fait partie d'un processus. Les threads d'un même processus partagent la même mémoire.</p>
<h2>États d'un processus</h2>
<ul>
<li><strong>Prêt (Ready)</strong> : Attend que le CPU lui soit alloué.</li>
<li><strong>Élu (Running)</strong> : En cours d'exécution sur le CPU.</li>
<li><strong>Bloqué (Waiting)</strong> : Attend un événement (lecture disque, réseau).</li>
</ul>
<h2>Commandes utiles (Linux)</h2>
<ul>
<li><code>ps aux</code> : Liste tous les processus en cours</li>
<li><code>top</code> ou <code>htop</code> : Moniteur système interactif</li>
<li><code>kill -9 PID</code> : Forcer l'arrêt d'un processus</li>
</ul>`
      },
      { 
        name: 'Architecture matérielle', 
        note: `<h1>Architecture Matérielle (Von Neumann)</h1>
<h2>Composants Principaux</h2>
<ul>
<li><strong>CPU (Processeur)</strong> : Le cerveau de l'ordinateur. Contient l'UAL (Unité Arithmétique et Logique) et les registres.</li>
<li><strong>RAM (Mémoire vive)</strong> : Mémoire très rapide mais volatile (se vide à l'arrêt). Stocke les programmes en cours d'exécution.</li>
<li><strong>Stockage de masse (Disque Dur / SSD)</strong> : Mémoire lente mais persistante.</li>
</ul>
<h2>Les Bus</h2>
<p>Ce sont les fils de communication entre les composants.</p>
<ul>
<li><strong>Bus de données</strong> : Transporte l'information.</li>
<li><strong>Bus d'adresse</strong> : Indique l'emplacement mémoire.</li>
<li><strong>Bus de contrôle</strong> : Gère les signaux (lecture, écriture, horloge).</li>
</ul>`
      }
    ]
  }
];

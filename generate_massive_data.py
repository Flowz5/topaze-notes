import json

data = [
  {
    "folder": "Langages",
    "subfolders": [
      {
        "name": "Python",
        "note": """<h1>Cheatsheet Python (BTS SIO)</h1>
<h2>1. Variables et Types de données</h2>
<pre><code># Nombres
entier = 42       # int
decimal = 3.14    # float
complexe = 1 + 2j # complex

# Chaines (String)
nom = "Alice"
multiligne = '''Ligne 1
Ligne 2'''

# Booléens
vrai = True
faux = False

# Conversion (Casting)
x = int("10")
y = str(42)</code></pre>

<h2>2. Structures de données</h2>
<pre><code># Listes (Mutables)
fruits = ["pomme", "banane", "cerise"]
fruits.append("orange")
premier = fruits[0]

# Tuples (Immuables)
coordonnees = (10.0, 20.0)

# Dictionnaires (Clé-Valeur)
etudiant = {
    "nom": "Dupont",
    "age": 20,
    "options": ["SLAM", "SISR"]
}
age = etudiant["age"]
etudiant["note"] = 18

# Sets (Ensembles uniques)
nombres_uniques = {1, 2, 2, 3} # Donne {1, 2, 3}</code></pre>

<h2>3. Structures de contrôle</h2>
<pre><code># Conditions
if age >= 18:
    print("Majeur")
elif age == 17:
    print("Presque majeur")
else:
    print("Mineur")

# Boucle For
for fruit in fruits:
    print(fruit)

for i in range(5): # 0, 1, 2, 3, 4
    print(i)

# Boucle While
compteur = 0
while compteur < 5:
    compteur += 1
    if compteur == 3:
        continue # Passe à l'itération suivante
    if compteur == 4:
        break    # Stoppe la boucle</code></pre>

<h2>4. Fonctions</h2>
<pre><code>def calculer_moyenne(notes: list) -> float:
    \"\"\"Docstring: Calcule la moyenne d'une liste\"\"\"
    if len(notes) == 0:
        return 0.0
    return sum(notes) / len(notes)

# Paramètres par défaut
def saluer(nom, message="Bonjour"):
    print(f"{message}, {nom}")

# Arguments multiples (*args, **kwargs)
def super_fonction(*args, **kwargs):
    print(args)   # Tuple des arguments sans nom
    print(kwargs) # Dico des arguments nommés</code></pre>

<h2>5. Programmation Orientée Objet (POO)</h2>
<pre><code>class Utilisateur:
    # Constructeur
    def __init__(self, nom, email):
        self.nom = nom        # Attribut public
        self._email = email   # Convention "protégé"
        self.__mdp = "123"    # Privé (name mangling)

    # Méthode
    def se_connecter(self):
        print(f"{self.nom} est connecté.")

# Héritage
class Admin(Utilisateur):
    def __init__(self, nom, email, droits):
        super().__init__(nom, email)
        self.droits = droits

admin = Admin("Root", "root@sys.com", ["lecture", "ecriture"])
admin.se_connecter()</code></pre>

<h2>6. Gestion des erreurs (Exceptions)</h2>
<pre><code>try:
    resultat = 10 / 0
except ZeroDivisionError:
    print("Erreur: division par zéro !")
except Exception as e:
    print(f"Erreur inattendue: {e}")
finally:
    print("Ce bloc s'exécute toujours (ex: fermer un fichier)")</code></pre>
"""
      },
      {
        "name": "Bash",
        "note": """<h1>Cheatsheet Bash (BTS SIO)</h1>
<h2>1. Base du script</h2>
<pre><code>#!/bin/bash
# Ceci est un commentaire
echo "Bonjour le monde"
</code></pre>

<h2>2. Variables et Paramètres</h2>
<pre><code># Déclaration (pas d'espace autour du =)
NOM="Alice"
AGE=20

# Utilisation
echo "Je m'appelle $NOM et j'ai $AGE ans"

# Variables spéciales
echo $0 # Nom du script
echo $1 # 1er argument passé au script
echo $2 # 2eme argument
echo $# # Nombre d'arguments
echo $? # Code de retour de la dernière commande (0 = succès)
echo $$ # PID du script actuel
</code></pre>

<h2>3. Conditions (If)</h2>
<pre><code>if [ "$AGE" -ge 18 ]; then
    echo "Majeur"
elif [ "$AGE" -eq 17 ]; then
    echo "Presque"
else
    echo "Mineur"
fi

# Opérateurs numériques: -eq (==), -ne (!=), -lt (<), -le (<=), -gt (>), -ge (>=)
# Opérateurs chaines: = (égal), != (différent), -z (vide), -n (non vide)

# Tests sur les fichiers
if [ -e "/chemin/fichier.txt" ]; then
    echo "Le fichier existe"
fi
# -d (est un dossier), -f (est un fichier standard), -r (lisible), -w (inscriptible), -x (exécutable)
</code></pre>

<h2>4. Boucles</h2>
<pre><code># Boucle FOR sur une liste
for OS in Linux Windows MacOS; do
    echo "Système: $OS"
done

# Boucle FOR avec compteur
for i in {1..5}; do
    echo "Tour $i"
done

# Boucle WHILE
COMPTEUR=1
while [ $COMPTEUR -le 5 ]; do
    echo $COMPTEUR
    ((COMPTEUR++))
done
</code></pre>

<h2>5. Fonctions</h2>
<pre><code>ma_fonction() {
    local VAR_LOCALE="Test" # Variable locale à la fonction
    echo "Argument 1 de la fonction: $1"
    return 0 # Code de succès
}

# Appel de la fonction
ma_fonction "Paramètre"
</code></pre>

<h2>6. Redirections et Pipes</h2>
<pre><code># Rediriger la sortie standard (écrase le fichier)
echo "Texte" > fichier.txt

# Rediriger et ajouter à la fin du fichier
echo "Suite" >> fichier.txt

# Rediriger les erreurs (stderr)
commande_qui_plante 2> erreurs.log

# Rediriger stdout ET stderr
commande > output.log 2>&1

# Pipes (Tubes): passer le résultat d'une commande à l'autre
cat /var/log/syslog | grep "error" | wc -l
</code></pre>
"""
      },
      {
        "name": "Java",
        "note": """<h1>Cheatsheet Java (BTS SIO)</h1>
<h2>1. Structure de base</h2>
<pre><code>// Le nom du fichier doit être Main.java
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello World!");
    }
}
</code></pre>

<h2>2. Types Primitifs vs Objets</h2>
<pre><code>// Primitifs (stockés dans la pile/stack)
int age = 20;
double prix = 19.99;
boolean estActif = true;
char lettre = 'A';

// Objets (stockés dans le tas/heap, manipulés par référence)
String nom = "Alice"; // Immuable
Integer ageObjet = 20; // Wrapper class
</code></pre>

<h2>3. Programmation Orientée Objet (POO)</h2>
<pre><code>// Classe abstraite
public abstract class Animal {
    protected String nom; // Accessible dans les sous-classes
    
    public Animal(String nom) {
        this.nom = nom;
    }
    
    public abstract void crier(); // Méthode abstraite
}

// Interface
public interface Volant {
    void voler();
}

// Classe concrète avec héritage et interface
public class Oiseau extends Animal implements Volant {
    
    public Oiseau(String nom) {
        super(nom); // Appel du constructeur parent
    }
    
    @Override
    public void crier() {
        System.out.println("Cui cui");
    }
    
    @Override
    public void voler() {
        System.out.println("Je vole !");
    }
}
</code></pre>

<h2>4. Collections (List, Set, Map)</h2>
<pre><code>import java.util.*;

// List (Ordonnée, doublons autorisés)
List&lt;String&gt; liste = new ArrayList&lt;&gt;();
liste.add("Pomme");
liste.get(0); // "Pomme"

// Set (Non ordonné, éléments uniques)
Set&lt;Integer&gt; set = new HashSet&lt;&gt;();
set.add(1);
set.add(1); // Ignoré

// Map (Clé-Valeur)
Map&lt;String, Integer&gt; map = new HashMap&lt;&gt;();
map.put("Alice", 18);
map.get("Alice"); // 18
</code></pre>

<h2>5. Exceptions</h2>
<pre><code>try {
    int resultat = 10 / 0;
} catch (ArithmeticException e) {
    System.out.println("Division par zéro !");
} catch (Exception e) {
    System.out.println("Erreur globale : " + e.getMessage());
} finally {
    System.out.println("Toujours exécuté");
}
</code></pre>

<h2>6. Streams (Java 8+)</h2>
<pre><code>List&lt;String&gt; prenoms = Arrays.asList("Alice", "Bob", "Charlie", "David");

// Filtrer et transformer
List&lt;String&gt; resultat = prenoms.stream()
    .filter(p -> p.length() > 3)        // Garde ceux > 3 lettres
    .map(String::toUpperCase)           // Met en majuscules
    .collect(Collectors.toList());      // Récupère en liste
</code></pre>
"""
      },
      {
        "name": "PHP",
        "note": """<h1>Cheatsheet PHP (BTS SIO)</h1>
<h2>1. Syntaxe et Variables</h2>
<pre><code>&lt;?php
// Typage dynamique mais on peut forcer le type (PHP 7+)
$entier = 42;
$chaine = "Alice";
$tableau = ["Pomme", "Banane"];

// Concaténation avec le point (.)
echo "Bonjour " . $chaine;

// Interpolation (seulement guillemets doubles)
echo "Bonjour $chaine";
?&gt;</code></pre>

<h2>2. Tableaux (Arrays)</h2>
<pre><code>&lt;?php
// Tableau indexé
$fruits = ["Pomme", "Banane"];
$fruits[] = "Cerise"; // Ajout à la fin

// Tableau associatif (Clé => Valeur)
$user = [
    "nom" => "Dupont",
    "age" => 20
];
echo $user["nom"]; // Dupont

// Parcourir un tableau
foreach ($user as $cle => $valeur) {
    echo "$cle : $valeur &lt;br&gt;";
}
?&gt;</code></pre>

<h2>3. Superglobales</h2>
<pre><code>&lt;?php
$_GET['id'];      // Données de l'URL (?id=5)
$_POST['nom'];    // Données d'un formulaire (method="POST")
$_SESSION['id'];  // Variables de session (serveur)
$_COOKIE['lang']; // Cookies du navigateur
$_SERVER['REMOTE_ADDR']; // IP du visiteur
?&gt;</code></pre>

<h2>4. Sessions</h2>
<pre><code>&lt;?php
// Doit toujours être appelé avant le moindre code HTML !
session_start();

// Écrire dans la session
$_SESSION['user_id'] = 42;

// Lire
if (isset($_SESSION['user_id'])) {
    echo "Connecté";
}

// Détruire la session (Déconnexion)
session_destroy();
?&gt;</code></pre>

<h2>5. Base de données avec PDO (Hyper important)</h2>
<pre><code>&lt;?php
// 1. Connexion (DDSN, User, Password)
$dsn = "mysql:host=localhost;dbname=monsite;charset=utf8mb4";
$options = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, // Active les erreurs
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC // Tableaux associatifs
];

try {
    $pdo = new PDO($dsn, "root", "", $options);
} catch (PDOException $e) {
    die("Erreur de connexion : " . $e->getMessage());
}

// 2. Requête préparée (Sécurité contre l'injection SQL)
$sql = "SELECT * FROM utilisateurs WHERE email = :email AND actif = :actif";
$stmt = $pdo->prepare($sql);

// 3. Exécution avec les paramètres
$stmt->execute([
    'email' => 'test@test.fr',
    'actif' => 1
]);

// 4. Récupération
$utilisateur = $stmt->fetch(); // Un seul résultat
$tous_utilisateurs = $stmt->fetchAll(); // Tous les résultats
?&gt;</code></pre>

<h2>6. POO en PHP</h2>
<pre><code>&lt;?php
class Utilisateur {
    private string $nom;
    
    public function __construct(string $nom) {
        $this->nom = $nom;
    }
    
    public function getNom(): string {
        return $this->nom;
    }
}

$u = new Utilisateur("Alice");
echo $u->getNom();
?&gt;</code></pre>
"""
      },
      {
        "name": "JS",
        "note": """<h1>Cheatsheet JavaScript (BTS SIO)</h1>
<h2>1. Variables et ES6+</h2>
<pre><code>// Ne plus utiliser "var" !
let age = 20; // Variable modifiable
const TAUX = 0.2; // Constante immuable

// Template literals (Backticks)
const message = \`J'ai \${age} ans\`;

// Arrow functions
const addition = (a, b) => a + b;

// Destructuring
const user = { nom: "Alice", id: 42 };
const { nom, id } = user;

// Spread operator (...)
const tab1 = [1, 2];
const tab2 = [...tab1, 3, 4]; // [1, 2, 3, 4]
</code></pre>

<h2>2. Manipulation du DOM</h2>
<pre><code>// Sélectionner des éléments
const bouton = document.getElementById("btn-submit");
const paragraphes = document.querySelectorAll(".texte"); // Retourne une NodeList

// Modifier le DOM
bouton.textContent = "Envoyer";
bouton.style.backgroundColor = "red";
bouton.classList.add("actif");

// Créer un élément
const div = document.createElement("div");
div.innerHTML = "&lt;strong&gt;Nouveau&lt;/strong&gt;";
document.body.appendChild(div);
</code></pre>

<h2>3. Événements (Events)</h2>
<pre><code>const form = document.querySelector("form");

form.addEventListener("submit", function(event) {
    // Empêche le rechargement de la page
    event.preventDefault(); 
    
    console.log("Formulaire soumis !");
});
</code></pre>

<h2>4. Promesses et Async/Await (Fetch)</h2>
<pre><code>// L'API Fetch retourne une Promesse
fetch("https://jsonplaceholder.typicode.com/users")
    .then(response => {
        if (!response.ok) throw new Error("Erreur HTTP");
        return response.json(); // Transforme le JSON en objet JS
    })
    .then(data => console.log(data))
    .catch(error => console.error(error));

// Équivalent moderne avec Async / Await
async function chargerUtilisateurs() {
    try {
        const response = await fetch("https://jsonplaceholder.typicode.com/users");
        if (!response.ok) throw new Error("Erreur");
        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error(error);
    }
}
chargerUtilisateurs();
</code></pre>

<h2>5. Fonctions de Tableaux utiles</h2>
<pre><code>const nombres = [1, 2, 3, 4, 5];

// Map (Transforme chaque élément)
const doubles = nombres.map(n => n * 2); // [2, 4, 6, 8, 10]

// Filter (Filtre selon une condition)
const pairs = nombres.filter(n => n % 2 === 0); // [2, 4]

// Reduce (Accumule les valeurs)
const somme = nombres.reduce((acc, curr) => acc + curr, 0); // 15

// Find (Trouve le PREMIER élément correspondant)
const grand = nombres.find(n => n > 3); // 4
</code></pre>
"""
      },
      {
        "name": "HTML",
        "note": """<h1>Cheatsheet HTML5 (BTS SIO)</h1>
<h2>1. Structure Documentaire & Sémantique</h2>
<pre><code>&lt;!DOCTYPE html&gt;
&lt;html lang="fr"&gt;
&lt;head&gt;
    &lt;meta charset="UTF-8"&gt;
    &lt;meta name="viewport" content="width=device-width, initial-scale=1.0"&gt;
    &lt;title&gt;Titre de l'onglet&lt;/title&gt;
    &lt;link rel="stylesheet" href="style.css"&gt;
&lt;/head&gt;
&lt;body&gt;
    &lt;header&gt;
        &lt;nav&gt;...&lt;/nav&gt;
    &lt;/header&gt;
    
    &lt;main&gt;
        &lt;article&gt;
            &lt;section&gt;...&lt;/section&gt;
        &lt;/article&gt;
        &lt;aside&gt;Barre latérale&lt;/aside&gt;
    &lt;/main&gt;
    
    &lt;footer&gt;...&lt;/footer&gt;
&lt;/body&gt;
&lt;/html&gt;</code></pre>

<h2>2. Formulaires et Inputs</h2>
<pre><code>&lt;form action="/traitement.php" method="POST" enctype="multipart/form-data"&gt;
    &lt;!-- L'attribut for du label doit correspondre à l'id de l'input --&gt;
    &lt;label for="username"&gt;Pseudo :&lt;/label&gt;
    &lt;input type="text" id="username" name="username" required minlength="3"&gt;
    
    &lt;label for="pwd"&gt;Mot de passe :&lt;/label&gt;
    &lt;input type="password" id="pwd" name="pwd" required&gt;
    
    &lt;!-- Boutons radios (même attribut 'name' pour lier les choix) --&gt;
    &lt;input type="radio" id="homme" name="genre" value="H"&gt;
    &lt;label for="homme"&gt;Homme&lt;/label&gt;
    
    &lt;!-- Liste déroulante --&gt;
    &lt;select name="pays"&gt;
        &lt;option value="fr"&gt;France&lt;/option&gt;
        &lt;option value="be"&gt;Belgique&lt;/option&gt;
    &lt;/select&gt;
    
    &lt;button type="submit"&gt;S'inscrire&lt;/button&gt;
&lt;/form&gt;</code></pre>

<h2>3. Tableaux Accessibles</h2>
<pre><code>&lt;table&gt;
    &lt;caption&gt;Liste des utilisateurs&lt;/caption&gt;
    &lt;thead&gt;
        &lt;tr&gt;
            &lt;th scope="col"&gt;ID&lt;/th&gt;
            &lt;th scope="col"&gt;Nom&lt;/th&gt;
        &lt;/tr&gt;
    &lt;/thead&gt;
    &lt;tbody&gt;
        &lt;tr&gt;
            &lt;td&gt;1&lt;/td&gt;
            &lt;td&gt;Alice&lt;/td&gt;
        &lt;/tr&gt;
    &lt;/tbody&gt;
&lt;/table&gt;</code></pre>
"""
      },
      {
        "name": "CSS",
        "note": """<h1>Cheatsheet CSS (BTS SIO)</h1>
<h2>1. Le Modèle de Boîte (Box Model)</h2>
<p>L'espace qu'occupe un élément est calculé ainsi :<br>
<strong>Width/Height + Padding + Border (+ Margin à l'extérieur)</strong></p>
<pre><code>.boite {
    /* Propriété vitale : inclut le padding et border dans la width/height */
    box-sizing: border-box; 
    
    width: 200px;
    padding: 10px; /* Espace intérieur */
    border: 2px solid black;
    margin: 20px auto; /* Centre horizontalement si display: block */
}</code></pre>

<h2>2. Flexbox (Mise en page 1D)</h2>
<pre><code>.container-flex {
    display: flex;
    
    /* Axe principal : row (gauche->droite), column (haut->bas) */
    flex-direction: row; 
    
    /* Alignement sur l'axe principal */
    justify-content: space-between; /* center, flex-start, flex-end, space-around */
    
    /* Alignement sur l'axe secondaire (croisé) */
    align-items: center; 
    
    /* Retour à la ligne si pas assez de place */
    flex-wrap: wrap; 
    gap: 1rem; /* Espace entre les éléments */
}</code></pre>

<h2>3. CSS Grid (Mise en page 2D)</h2>
<pre><code>.container-grid {
    display: grid;
    /* 3 colonnes : 1ère 200px, 2ème auto, 3ème auto */
    grid-template-columns: 200px 1fr 1fr;
    
    /* 2 lignes : 100px et auto */
    grid-template-rows: 100px auto;
    
    gap: 20px;
}

.enfant {
    /* S'étaler sur 2 colonnes */
    grid-column: span 2; 
}</code></pre>

<h2>4. Media Queries (Responsive)</h2>
<pre><code>/* Styles de base pour Mobile First (Téléphones) */
.menu { display: block; }

/* Styles pour Tablettes et Ordinateurs */
@media screen and (min-width: 768px) {
    .menu {
        display: flex;
    }
}</code></pre>

<h2>5. Variables CSS</h2>
<pre><code>:root {
    --couleur-primaire: #3498db;
    --espacement: 1rem;
}

.bouton {
    background-color: var(--couleur-primaire);
    padding: var(--espacement);
}</code></pre>
"""
      }
    ]
  },
  {
    "folder": "Frameworks",
    "subfolders": [
      {
        "name": "Symfony",
        "note": """<h1>Cheatsheet Symfony (BTS SIO)</h1>
<h2>1. Console et Générateurs (Maker Bundle)</h2>
<pre><code># Lancer le serveur local
php bin/console server:run # Symfony 4
symfony server:start       # Symfony CLI

# Créer des fichiers automatiquement
php bin/console make:controller
php bin/console make:entity
php bin/console make:form
php bin/console make:crud

# Gérer la base de données (Doctrine)
php bin/console doctrine:database:create
php bin/console make:migration
php bin/console doctrine:migrations:migrate
</code></pre>

<h2>2. Routage et Contrôleur (PHP 8 Attributes)</h2>
<pre><code>namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

class ArticleController extends AbstractController
{
    #[Route('/article/{id}', name: 'article_show', methods: ['GET'])]
    public function show(int $id): Response
    {
        // Rendu du template Twig
        return $this->render('article/show.html.twig', [
            'identifiant' => $id
        ]);
    }
    
    // Redirection
    #[Route('/old', name: 'old_route')]
    public function old(): Response
    {
        return $this->redirectToRoute('article_show', ['id' => 1]);
    }
}
</code></pre>

<h2>3. Moteur de Template (Twig)</h2>
<pre><code>{# Afficher une variable #}
{{ identifiant }}

{# Filtres #}
{{ article.title | upper }}
{{ article.date | date('d/m/Y') }}

{# Conditions #}
{% if is_granted('ROLE_ADMIN') %}
    &lt;a href="#"&gt;Supprimer&lt;/a&gt;
{% endif %}

{# Boucles #}
{% for user in users %}
    &lt;li&gt;{{ user.name }}&lt;/li&gt;
{% else %}
    &lt;li&gt;Aucun utilisateur&lt;/li&gt;
{% endfor %}

{# Générer des liens #}
&lt;a href="{{ path('article_show', {id: 5}) }}"&gt;Voir&lt;/a&gt;

{# Héritage de templates #}
{% extends 'base.html.twig' %}
{% block body %}
    Mon contenu ici
{% endblock %}
</code></pre>

<h2>4. ORM Doctrine (Interroger la BDD sans SQL)</h2>
<pre><code>use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;

// Sauvegarder en BDD (Persist & Flush)
public function create(EntityManagerInterface $em) {
    $user = new User();
    $user->setName("Alice");
    
    $em->persist($user); // Prépare
    $em->flush(); // Exécute l'INSERT
}

// Lire depuis la BDD (Repository)
public function read(UserRepository $repo) {
    $all = $repo->findAll();
    $alice = $repo->findOneBy(['name' => 'Alice']);
}
</code></pre>
"""
      },
      {
        "name": "Bootstrap",
        "note": """<h1>Cheatsheet Bootstrap 5 (BTS SIO)</h1>
<h2>1. Le système de Grille (Grid)</h2>
<p>La grille Bootstrap est divisée en <strong>12 colonnes</strong> par ligne.</p>
<pre><code>&lt;div class="container"&gt; &lt;!-- ou container-fluid pour pleine largeur --&gt;
    &lt;div class="row"&gt;
        &lt;!-- Breakpoints : col (mobile), col-sm, col-md, col-lg, col-xl --&gt;
        
        &lt;!-- Prend 12 cols sur mobile, 6 sur tablette/PC --&gt;
        &lt;div class="col-12 col-md-6"&gt;Moitié gauche&lt;/div&gt;
        &lt;div class="col-12 col-md-6"&gt;Moitié droite&lt;/div&gt;
    &lt;/div&gt;
&lt;/div&gt;
</code></pre>

<h2>2. Utilitaires de marge et d'espacement (Spacing)</h2>
<p>Format : <code>{Propriété}{Côté}-{Taille}</code></p>
<ul>
<li><strong>Propriété</strong> : <code>m</code> (margin), <code>p</code> (padding)</li>
<li><strong>Côté</strong> : <code>t</code> (top), <code>b</code> (bottom), <code>s</code> (start/left), <code>e</code> (end/right), <code>x</code> (axe horizontal), <code>y</code> (axe vertical), rien (tous les côtés).</li>
<li><strong>Taille</strong> : 0 à 5, ou <code>auto</code>.</li>
</ul>
<pre><code>&lt;div class="mt-3 p-4 mx-auto"&gt;
    Margin top 3, Padding partout 4, Margin horizontal auto (Centrage)
&lt;/div&gt;</code></pre>

<h2>3. Couleurs (Theme colors)</h2>
<pre><code>&lt;!-- Couleurs de texte --&gt;
&lt;p class="text-primary"&gt;Bleu (Principal)&lt;/p&gt;
&lt;p class="text-success"&gt;Vert (Succès)&lt;/p&gt;
&lt;p class="text-danger"&gt;Rouge (Erreur)&lt;/p&gt;
&lt;p class="text-warning"&gt;Jaune (Alerte)&lt;/p&gt;
&lt;p class="text-info"&gt;Cyan (Info)&lt;/p&gt;

&lt;!-- Couleurs de fond (Background) --&gt;
&lt;div class="bg-dark text-white"&gt;Fond sombre, texte blanc&lt;/div&gt;
</code></pre>

<h2>4. Composants utiles</h2>
<pre><code>&lt;!-- Boutons --&gt;
&lt;button class="btn btn-primary btn-lg"&gt;Gros bouton bleu&lt;/button&gt;
&lt;button class="btn btn-outline-danger"&gt;Bouton rouge creux&lt;/button&gt;

&lt;!-- Cartes (Cards) --&gt;
&lt;div class="card" style="width: 18rem;"&gt;
  &lt;img src="..." class="card-img-top" alt="..."&gt;
  &lt;div class="card-body"&gt;
    &lt;h5 class="card-title"&gt;Titre&lt;/h5&gt;
    &lt;p class="card-text"&gt;Texte&lt;/p&gt;
    &lt;a href="#" class="btn btn-primary"&gt;Action&lt;/a&gt;
  &lt;/div&gt;
&lt;/div&gt;
</code></pre>
"""
      }
    ]
  },
  {
    "folder": "Linux",
    "subfolders": [
      {
        "name": "Commandes",
        "note": """<h1>Cheatsheet Commandes Linux (BTS SIO)</h1>
<h2>1. Navigation et Fichiers</h2>
<pre><code>pwd          # Afficher le dossier actuel (Print Working Directory)
ls -lah      # Lister les fichiers (-l: détails, -a: cachés, -h: taille lisible)
cd /var/log  # Se déplacer dans un dossier
cd ..        # Remonter d'un dossier
cd ~         # Retourner au dossier personnel (Home)

mkdir test   # Créer un dossier
touch file   # Créer un fichier vide
rm -rf test  # Supprimer un dossier et son contenu (DANGER)
cp a.txt b/  # Copier un fichier
mv a.txt b/  # Déplacer ou renommer
</code></pre>

<h2>2. Lecture et Recherche de fichiers</h2>
<pre><code>cat log.txt  # Afficher tout le fichier
less log.txt # Afficher avec pagination (Q pour quitter)
tail -f log  # Afficher la fin du fichier en temps réel

grep "error" fichier.txt # Chercher la chaîne "error"
grep -r "error" /var/   # Chercher récursivement dans les dossiers

find /var -name "*.log"  # Chercher les fichiers finissant par .log
</code></pre>

<h2>3. Permissions et Droits</h2>
<pre><code># Propriétaires: u (user), g (group), o (others)
# Droits: r (read=4), w (write=2), x (execute=1)

chmod 755 script.sh # rwx pour User, r-x pour Groupe et Autres
chmod +x script.sh  # Rend le fichier exécutable

chown bob:www-data fichier # Change propriétaire (bob) et groupe (www-data)
</code></pre>

<h2>4. Système et Processus</h2>
<pre><code>ps aux       # Liste tous les processus
top          # Gestionnaire de tâches interactif
htop         # (Si installé) Mieux que top
kill 1234    # Tuer le PID 1234 proprement (SIGTERM)
kill -9 1234 # Tuer le PID 1234 violemment (SIGKILL)

df -h        # Espace disque libre
free -m      # RAM libre (en Mo)
</code></pre>

<h2>5. Réseau</h2>
<pre><code>ip a         # Afficher les adresses IP (remplace ifconfig)
ping 8.8.8.8 # Tester la connectivité
netstat -tulnp # Lister les ports ouverts en écoute (nécessite root)
ss -tulnp    # Alternative moderne à netstat

curl -I http://google.fr # Voir les en-têtes HTTP
wget http://.../file.zip # Télécharger un fichier
</code></pre>
"""
      }
    ]
  },
  {
    "folder": "Système",
    "subfolders": [
      {
        "name": "Architecture et Processus",
        "note": """<h1>Cheatsheet Système (BTS SIO)</h1>
<h2>1. Architecture Matérielle (Von Neumann)</h2>
<ul>
<li><strong>Processeur (CPU)</strong> : Le cerveau. Contient l'UAL (Unité Arithmétique et Logique pour les calculs), l'Unité de Contrôle (qui séquence les instructions), et les Registres (mémoire ultra-rapide interne).</li>
<li><strong>Mémoire Vive (RAM)</strong> : Stocke les programmes et les données en cours de traitement. Elle est Volatile (effacée hors tension).</li>
<li><strong>Stockage Secondaire (Disque/SSD)</strong> : Stockage persistant, mais lent comparé à la RAM.</li>
<li><strong>Bus</strong> : Voies de communication. 
    <ul>
        <li><em>Bus d'adresses</em> (Où écrire/lire ?)</li>
        <li><em>Bus de données</em> (Quoi écrire/lire ?)</li>
        <li><em>Bus de contrôle</em> (Quelle action ? ex: Read/Write)</li>
    </ul>
</li>
</ul>

<h2>2. Les Processus</h2>
<p>Un <strong>processus</strong> est l'image d'un programme en cours d'exécution. Il dispose d'un PID (identifiant), d'un espace mémoire virtuel isolé, et de descripteurs de fichiers.</p>

<h3>États d'un processus :</h3>
<ul>
<li><strong>Prêt (Ready)</strong> : En file d'attente, il a toutes ses ressources et attend juste que le CPU soit libre.</li>
<li><strong>Élu (Running)</strong> : En train de s'exécuter sur le CPU.</li>
<li><strong>Bloqué (Waiting/Sleeping)</strong> : Il a demandé une opération lente (ex: lecture disque, saisie clavier) et s'endort en attendant la réponse pour libérer le CPU.</li>
<li><strong>Zombie</strong> : Un processus terminé mais dont le père n'a pas encore lu le code de retour.</li>
</ul>

<h2>3. Threads et Concurrence</h2>
<p>Un <strong>Thread</strong> (Fil d'exécution) est une unité d'exécution à l'intérieur d'un processus.</p>
<ul>
<li>Les processus sont <strong>isolés</strong> (l'un ne peut pas lire la RAM de l'autre).</li>
<li>Les threads d'un même processus <strong>partagent</strong> la même RAM. S'ils modifient la même variable en même temps, ça crée des bugs (Race Conditions).</li>
</ul>
<p>Pour éviter ça, on utilise des <strong>Mutex</strong> (verrous) ou des <strong>Sémaphores</strong>.</p>

<h2>4. Gestion de la Mémoire (OS)</h2>
<ul>
<li><strong>Pagination (Paging)</strong> : Découpe la RAM en pages de taille fixe (ex: 4Ko) pour éviter la fragmentation.</li>
<li><strong>Swapping (Fichier d'échange)</strong> : Si la RAM est pleine, l'OS copie les pages inactives sur le disque dur. Cela ralentit énormément le PC (Thrashing).</li>
</ul>
"""
      }
    ]
  }
]

# Write to a valid TypeScript file
ts_content = "export const structureBtsSio = " + json.dumps(data, indent=2, ensure_ascii=False) + ";\n"

with open("src/dataBtsSio.ts", "w", encoding="utf-8") as f:
    f.write(ts_content)

print("Data generated")

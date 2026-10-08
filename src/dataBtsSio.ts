export const structureBtsSio = [
  {
    folder: "Langages",
    subfolders: [
      {
        name: "Python",
        note: `<h1>Cheatsheet Python — BTS SIO</h1>

<h2>1. Variables et Types</h2>
<pre><code># Nombres
entier = 42
decimal = 3.14

# Chaines
nom = "Alice"
multiligne = """Ligne 1
Ligne 2"""

# Conversion (Casting)
x = int("10")
y = str(42)
z = float("3.14")</code></pre>

<h2>2. Structures de données</h2>
<pre><code># Liste (Mutable, ordonnée)
fruits = ["pomme", "banane", "cerise"]
fruits.append("orange")
fruits.insert(0, "fraise")
fruits.remove("banane")
sous_liste = fruits[1:3]    # Slicing

# Tuple (Immuable)
coordonnees = (10.0, 20.0)
x, y = coordonnees          # Déstructuration

# Dictionnaire (Clé-Valeur)
etudiant = {
    "nom": "Dupont",
    "age": 20,
    "options": ["SLAM", "SISR"]
}
age = etudiant["age"]
etudiant["note"] = 18
etudiant.get("absent", "N/A")  # Lecture sécurisée

# Set (Ensemble unique)
nombres = {1, 2, 2, 3}     # Donne {1, 2, 3}</code></pre>

<h2>3. Conditions et Boucles</h2>
<pre><code>if age >= 18:
    print("Majeur")
elif age == 17:
    print("Presque majeur")
else:
    print("Mineur")

for fruit in fruits:
    print(fruit)

for i in range(5):         # 0, 1, 2, 3, 4
    print(i)

for index, val in enumerate(fruits):
    print(f"{index}: {val}")

compteur = 0
while compteur < 5:
    compteur += 1
    if compteur == 3:
        continue
    if compteur == 4:
        break

# List Comprehension
carres = [x**2 for x in range(10) if x % 2 == 0]</code></pre>

<h2>4. Fonctions</h2>
<pre><code>def calculer_moyenne(notes: list) -> float:
    """Calcule la moyenne d'une liste de notes."""
    if not notes:
        return 0.0
    return sum(notes) / len(notes)

def saluer(nom, message="Bonjour"):
    print(f"{message}, {nom} !")

def afficher(*args, **kwargs):
    print(args)    # Tuple d'arguments positionnels
    print(kwargs)  # Dict d'arguments nommés

carre = lambda x: x ** 2</code></pre>

<h2>5. Programmation Orientée Objet</h2>
<pre><code>class Utilisateur:
    role = "user"  # Attribut de classe partagé

    def __init__(self, nom, email):
        self.nom = nom        # Public
        self._email = email   # Protégé (convention)
        self.__mdp = "123"    # Privé (name mangling)

    def se_connecter(self):
        print(f"{self.nom} est connecté.")

    def __str__(self):
        return f"Utilisateur({self.nom})"

class Admin(Utilisateur):
    role = "admin"

    def __init__(self, nom, email, droits):
        super().__init__(nom, email)
        self.droits = droits</code></pre>

<h2>6. Exceptions</h2>
<pre><code>try:
    resultat = 10 / 0
except ZeroDivisionError:
    print("Division par zéro !")
except Exception as e:
    print(f"Erreur inattendue: {e}")
else:
    print("Tout s'est bien passé")
finally:
    print("Ce bloc s'exécute TOUJOURS")</code></pre>

<h2>7. Fichiers et JSON</h2>
<pre><code>import json

with open("data.txt", "r", encoding="utf-8") as f:
    contenu = f.read()

with open("output.txt", "w", encoding="utf-8") as f:
    f.write("Bonjour !")

data = {"nom": "Alice", "age": 20}
json_str = json.dumps(data, indent=2)
data_back = json.loads(json_str)</code></pre>`
      },
      {
        name: "Bash",
        note: `<h1>Cheatsheet Bash — BTS SIO</h1>

<h2>1. Structure d'un script</h2>
<pre><code>#!/bin/bash
# Shebang : indique l'interpréteur à utiliser.
# Rendre exécutable : chmod +x script.sh
# Lancer : ./script.sh arg1 arg2

echo "Bonjour le monde"</code></pre>

<h2>2. Variables</h2>
<pre><code>NOM="Alice"
AGE=20

echo "Je m'appelle \$NOM et j'ai \$AGE ans"

echo \$0    # Nom du script
echo \$1    # 1er argument
echo \$#    # Nombre d'arguments
echo \$?    # Code de retour (0 = succès)
echo \$\$    # PID du script

DATE=\$(date +"%Y-%m-%d")
FICHIERS=\$(ls | wc -l)</code></pre>

<h2>3. Conditions</h2>
<pre><code>if [ "\$AGE" -ge 18 ]; then
    echo "Majeur"
elif [ "\$AGE" -eq 17 ]; then
    echo "Presque"
else
    echo "Mineur"
fi

# Opérateurs numériques: -eq, -ne, -lt, -le, -gt, -ge
# Opérateurs chaines: =, !=, -z (vide), -n (non vide)

# Tests fichiers
if [ -f "fichier.txt" ]; then echo "Fichier"; fi
if [ -d "/var/log" ]; then echo "Dossier"; fi
if [ -e "/chemin" ]; then echo "Existe"; fi
if [ -x "script.sh" ]; then echo "Exécutable"; fi

# Opérateurs logiques
if [ "\$A" -gt 0 ] && [ "\$B" -gt 0 ]; then echo "OK"; fi
if [ "\$A" -eq 0 ] || [ "\$B" -eq 0 ]; then echo "NOK"; fi</code></pre>

<h2>4. Boucles</h2>
<pre><code>for OS in Linux Windows MacOS; do
    echo "Système: \$OS"
done

for i in {1..10}; do
    echo "Tour \$i"
done

for fichier in /var/log/*.log; do
    echo "Fichier: \$fichier"
done

COMPTEUR=1
while [ \$COMPTEUR -le 5 ]; do
    echo \$COMPTEUR
    ((COMPTEUR++))
done</code></pre>

<h2>5. Fonctions</h2>
<pre><code>verifier_age() {
    local age=\$1
    if [ "\$age" -ge 18 ]; then
        echo "Majeur"
        return 0
    else
        echo "Mineur"
        return 1
    fi
}

verifier_age 20
if verifier_age 16; then
    echo "Accès refusé"
fi</code></pre>

<h2>6. Redirections et Pipes</h2>
<pre><code>echo "Texte" > fichier.txt        # Écraser
echo "Suite" >> fichier.txt       # Ajouter
ls /inexistant 2> erreurs.log     # Rediriger stderr
commande > out.log 2>&1           # stdout + stderr

# Pipes
cat /etc/passwd | grep "root" | cut -d: -f1
ls -la | sort -k5 -n | tail -5   # Les 5 plus gros fichiers</code></pre>`
      },
      {
        name: "Java",
        note: `<h1>Cheatsheet Java — BTS SIO</h1>

<h2>1. Structure de base</h2>
<pre><code>// Nom du fichier = nom de la classe publique : Main.java
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello World!");
    }
}</code></pre>

<h2>2. Types Primitifs et Objets</h2>
<pre><code>// Primitifs
int age = 20;
long grand = 10_000_000L;
double prix = 19.99;
boolean actif = true;
char lettre = 'A';

// Objets
String nom = "Alice";            // Immuable
Integer ageObj = 20;             // Wrapper class

// Tableaux
int[] notes = {12, 15, 8, 18};
String[] prenoms = new String[5];</code></pre>

<h2>3. Collections</h2>
<pre><code>import java.util.*;

// List
List&lt;String&gt; liste = new ArrayList&lt;&gt;();
liste.add("Pomme");
liste.get(0);              // "Pomme"
liste.size();              // 1

// Set (unique)
Set&lt;Integer&gt; set = new HashSet&lt;&gt;();
set.add(1); set.add(1);    // Un seul élément

// Map
Map&lt;String, Integer&gt; map = new HashMap&lt;&gt;();
map.put("Alice", 18);
map.get("Alice");          // 18
map.getOrDefault("X", 0); // 0 si absent

for (Map.Entry&lt;String, Integer&gt; e : map.entrySet()) {
    System.out.println(e.getKey() + " -> " + e.getValue());
}</code></pre>

<h2>4. POO — Héritage et Interfaces</h2>
<pre><code>// Interface
public interface Serialisable {
    String toJson();
    default String toXml() { return "&lt;data/&gt;"; }
}

// Classe abstraite
public abstract class Forme {
    protected String couleur;
    public Forme(String couleur) { this.couleur = couleur; }
    public abstract double calculerSurface();
}

// Classe concrète
public class Cercle extends Forme implements Serialisable {
    private double rayon;

    public Cercle(String couleur, double rayon) {
        super(couleur);
        this.rayon = rayon;
    }

    @Override
    public double calculerSurface() {
        return Math.PI * rayon * rayon;
    }

    @Override
    public String toJson() {
        return "{\"rayon\":" + rayon + "}";
    }
}

// Polymorphisme
Forme f = new Cercle("rouge", 5.0);
System.out.println(f.calculerSurface());</code></pre>

<h2>5. Exceptions</h2>
<pre><code>try {
    int resultat = 10 / 0;
} catch (ArithmeticException e) {
    System.out.println("Division par zéro !");
} catch (Exception e) {
    System.out.println("Erreur : " + e.getMessage());
} finally {
    System.out.println("Toujours exécuté");
}</code></pre>

<h2>6. Streams (Java 8+)</h2>
<pre><code>List&lt;String&gt; prenoms = Arrays.asList("Alice", "Bob", "Charlie", "David");

List&lt;String&gt; resultat = prenoms.stream()
    .filter(p -> p.length() > 3)
    .map(String::toUpperCase)
    .sorted()
    .collect(Collectors.toList());

long count = prenoms.stream().filter(p -> p.startsWith("A")).count();</code></pre>`
      },
      {
        name: "Kotlin",
        note: `<h1>Cheatsheet Kotlin — BTS SIO</h1>

<h2>1. Variables et Types</h2>
<pre><code>val immuable = "Fixe"      // val = final (Java)
var modifiable = "Change"  // var = classique

val prix: Double = 19.99
val actif: Boolean = true</code></pre>

<h2>2. Null Safety</h2>
<pre><code>var texte: String = "Bonjour"
// texte = null  // ERREUR DE COMPILATION

var nullable: String? = null

// Safe call
println(nullable?.length)   // null sans crash

// Elvis operator — valeur par défaut si null
val longueur = nullable?.length ?: 0

// Force unwrap (DANGER)
val forceLen = nullable!!.length   // Crash si null</code></pre>

<h2>3. Fonctions</h2>
<pre><code>fun additionner(a: Int, b: Int): Int {
    return a + b
}

// Expression (une ligne)
fun carré(x: Int) = x * x

// Paramètres nommés et par défaut
fun saluer(nom: String, message: String = "Bonjour") {
    println("\$message, \$nom !")
}
saluer("Alice")
saluer(message = "Salut", nom = "Bob")</code></pre>

<h2>4. Classes et Data Classes</h2>
<pre><code>// Classe classique — constructeur primaire concis
class Chien(val nom: String, var age: Int) {
    fun aboyer() = println("Waf ! Je suis \$nom")
}

// Data class — génère equals(), hashCode(), toString(), copy()
data class Utilisateur(val id: Int, val email: String, val nom: String)

val user1 = Utilisateur(1, "test@test.fr", "Alice")
val user2 = user1.copy(id = 2, nom = "Bob")
println(user1 == user2)  // false</code></pre>

<h2>5. Fonctions d'extension</h2>
<pre><code>fun String.estUnEmail(): Boolean = this.contains("@") && this.contains(".")
fun Int.estPair(): Boolean = this % 2 == 0

println("test@domain.com".estUnEmail())  // true
println(4.estPair())                      // true</code></pre>

<h2>6. Scope Functions</h2>
<pre><code>// apply : Configurer un objet et le retourner
val liste = mutableListOf(1, 2, 3).apply {
    add(4)
    remove(1)
}

// let : Exécuter un bloc si non null
val message: String? = "Coucou"
message?.let {
    println(it.uppercase())  // COUCOU
}

// also : Action sur l'objet sans le modifier
val nombres = mutableListOf(1, 2, 3)
    .also { println("Liste: \${it.size} éléments") }</code></pre>`
      },
      {
        name: "HTML",
        note: `<h1>Cheatsheet HTML5 — BTS SIO</h1>

<h2>1. Structure Sémantique Complète</h2>
<pre><code>&lt;!DOCTYPE html&gt;
&lt;html lang="fr"&gt;
&lt;head&gt;
    &lt;meta charset="UTF-8"&gt;
    &lt;meta name="viewport" content="width=device-width, initial-scale=1.0"&gt;
    &lt;meta name="description" content="Description pour le SEO"&gt;
    &lt;title&gt;Titre visible dans l'onglet&lt;/title&gt;
    &lt;link rel="stylesheet" href="style.css"&gt;
    &lt;link rel="icon" href="favicon.ico"&gt;
&lt;/head&gt;
&lt;body&gt;
    &lt;header&gt;
        &lt;nav&gt;
            &lt;ul&gt;
                &lt;li&gt;&lt;a href="/"&gt;Accueil&lt;/a&gt;&lt;/li&gt;
                &lt;li&gt;&lt;a href="/contact"&gt;Contact&lt;/a&gt;&lt;/li&gt;
            &lt;/ul&gt;
        &lt;/nav&gt;
    &lt;/header&gt;
    &lt;main&gt;
        &lt;article&gt;
            &lt;h1&gt;Titre (un seul h1 par page)&lt;/h1&gt;
            &lt;section&gt;
                &lt;h2&gt;Sous-titre&lt;/h2&gt;
                &lt;p&gt;Contenu...&lt;/p&gt;
            &lt;/section&gt;
        &lt;/article&gt;
        &lt;aside&gt;Barre latérale&lt;/aside&gt;
    &lt;/main&gt;
    &lt;footer&gt;Pied de page&lt;/footer&gt;
    &lt;script src="app.js" defer&gt;&lt;/script&gt;
&lt;/body&gt;
&lt;/html&gt;</code></pre>

<h2>2. Formulaire Complet</h2>
<pre><code>&lt;form action="/traitement.php" method="POST" enctype="multipart/form-data"&gt;
    &lt;label for="username"&gt;Pseudo :&lt;/label&gt;
    &lt;input type="text" id="username" name="username"
           required minlength="3" maxlength="50" placeholder="Votre pseudo"&gt;

    &lt;label for="pwd"&gt;Mot de passe :&lt;/label&gt;
    &lt;input type="password" id="pwd" name="pwd" required&gt;

    &lt;label for="email"&gt;Email :&lt;/label&gt;
    &lt;input type="email" id="email" name="email" required&gt;

    &lt;label for="age"&gt;Age :&lt;/label&gt;
    &lt;input type="number" id="age" name="age" min="16" max="99"&gt;

    &lt;fieldset&gt;
        &lt;legend&gt;Sexe :&lt;/legend&gt;
        &lt;input type="radio" id="h" name="genre" value="H"&gt;
        &lt;label for="h"&gt;Homme&lt;/label&gt;
        &lt;input type="radio" id="f" name="genre" value="F"&gt;
        &lt;label for="f"&gt;Femme&lt;/label&gt;
    &lt;/fieldset&gt;

    &lt;input type="checkbox" id="cgu" name="cgu" value="1" required&gt;
    &lt;label for="cgu"&gt;J'accepte les CGU&lt;/label&gt;

    &lt;select id="pays" name="pays"&gt;
        &lt;option value=""&gt;-- Choisir --&lt;/option&gt;
        &lt;option value="fr" selected&gt;France&lt;/option&gt;
        &lt;option value="be"&gt;Belgique&lt;/option&gt;
    &lt;/select&gt;

    &lt;label for="msg"&gt;Message :&lt;/label&gt;
    &lt;textarea id="msg" name="msg" rows="4"&gt;&lt;/textarea&gt;

    &lt;input type="file" name="avatar" accept="image/*"&gt;

    &lt;button type="submit"&gt;Envoyer&lt;/button&gt;
    &lt;button type="reset"&gt;Réinitialiser&lt;/button&gt;
&lt;/form&gt;</code></pre>

<h2>3. Tableau Accessible</h2>
<pre><code>&lt;table&gt;
    &lt;caption&gt;Liste des utilisateurs&lt;/caption&gt;
    &lt;thead&gt;
        &lt;tr&gt;
            &lt;th scope="col"&gt;ID&lt;/th&gt;
            &lt;th scope="col"&gt;Nom&lt;/th&gt;
            &lt;th scope="col"&gt;Email&lt;/th&gt;
        &lt;/tr&gt;
    &lt;/thead&gt;
    &lt;tbody&gt;
        &lt;tr&gt;
            &lt;td&gt;1&lt;/td&gt;
            &lt;td&gt;Alice&lt;/td&gt;
            &lt;td&gt;alice@test.fr&lt;/td&gt;
        &lt;/tr&gt;
    &lt;/tbody&gt;
    &lt;tfoot&gt;
        &lt;tr&gt;&lt;td colspan="3"&gt;Total : 1 utilisateur&lt;/td&gt;&lt;/tr&gt;
    &lt;/tfoot&gt;
&lt;/table&gt;</code></pre>`
      },
      {
        name: "CSS",
        note: `<h1>Cheatsheet CSS — BTS SIO</h1>

<h2>1. Sélecteurs et Pseudo-classes</h2>
<pre><code>p { color: black; }
.ma-classe { color: red; }
#mon-id { background: blue; }

article p { ... }        /* p descendant de article */
ul > li { ... }          /* li enfant direct de ul */
h1 + p { ... }           /* p immédiatement après h1 */

a:hover { text-decoration: underline; }
a:visited { color: purple; }
input:focus { border: 2px solid blue; }
li:first-child { font-weight: bold; }
li:nth-child(2n) { background: #eee; }
li:not(.special) { opacity: 0.7; }

p::first-line { font-variant: small-caps; }
.liste::before { content: "→ "; }</code></pre>

<h2>2. Box Model</h2>
<pre><code>.boite {
    box-sizing: border-box;   /* Inclut padding et border dans width */

    width: 300px;
    height: auto;

    padding: 10px 20px;       /* vertical horizontal */
    border: 2px solid #333;
    margin: 1rem auto;        /* auto = centrage horizontal pour block */

    background-color: #f0f0f0;
    color: #333;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}</code></pre>

<h2>3. Flexbox</h2>
<pre><code>.container {
    display: flex;
    flex-direction: row;          /* row, column, row-reverse, column-reverse */
    justify-content: space-between; /* center, flex-start, flex-end, space-around */
    align-items: center;          /* flex-start, flex-end, stretch, baseline */
    flex-wrap: wrap;
    gap: 1rem;
}

.enfant {
    flex: 1;                      /* flex-grow: 1 */
    flex: 0 0 200px;              /* Largeur fixe */
    order: 2;
    align-self: flex-start;
}</code></pre>

<h2>4. CSS Grid</h2>
<pre><code>.grille {
    display: grid;
    grid-template-columns: 200px 1fr 2fr;
    grid-template-rows: auto 1fr auto;
    gap: 20px;
    grid-template-areas:
        "header header header"
        "sidebar main main"
        "footer footer footer";
}

.header  { grid-area: header; }
.sidebar { grid-area: sidebar; }
.main    { grid-area: main; }
.footer  { grid-area: footer; }

.grand { grid-column: 1 / 3; grid-row: span 2; }</code></pre>

<h2>5. Responsive (Media Queries)</h2>
<pre><code>/* Mobile First */
.menu { display: none; }
.burger { display: flex; }

@media screen and (min-width: 768px) {
    .menu { display: flex; }
    .burger { display: none; }
}

@media screen and (min-width: 1200px) {
    .container { max-width: 1140px; margin: auto; }
}

@media (prefers-color-scheme: dark) {
    body { background: #1a1a2e; color: white; }
}</code></pre>

<h2>6. Variables CSS et Animations</h2>
<pre><code>:root {
    --couleur-primaire: #3498db;
    --fond: #1a1a2e;
    --radius: 8px;
    --espacement: 1rem;
}

.bouton {
    background: var(--couleur-primaire);
    border-radius: var(--radius);
    transition: transform 0.2s, background 0.2s;
}
.bouton:hover {
    transform: translateY(-2px);
    background: #2980b9;
}

@keyframes apparaitre {
    from { opacity: 0; transform: translateY(-10px); }
    to   { opacity: 1; transform: translateY(0); }
}
.element { animation: apparaitre 0.3s ease-out; }</code></pre>`
      },
      {
        name: "JS",
        note: `<h1>Cheatsheet JavaScript ES6+ — BTS SIO</h1>

<h2>1. Variables et ES6+</h2>
<pre><code>let age = 20;
const PI = 3.14;

const message = \`J'ai \${age} ans\`;

const user = { nom: "Alice", id: 42 };
const { nom, id, role = "user" } = user;

const [premier, second, ...reste] = [1, 2, 3, 4, 5];

const tab1 = [1, 2];
const tab2 = [...tab1, 3, 4];
const obj2 = { ...user, age: 25 };</code></pre>

<h2>2. Fonctions</h2>
<pre><code>// Classique
function saluer(nom) { return "Bonjour " + nom; }

// Arrow
const saluer = (nom) => "Bonjour " + nom;
const carré  = x    => x * x;

// Paramètres par défaut et rest
function addition(a = 0, b = 0) { return a + b; }
function somme(...nombres) { return nombres.reduce((a, b) => a + b, 0); }</code></pre>

<h2>3. Manipulation du DOM</h2>
<pre><code>const bouton  = document.getElementById("btn");
const premier = document.querySelector(".card");
const tous    = document.querySelectorAll(".card");

bouton.textContent = "Nouveau texte";
bouton.style.color = "red";
bouton.classList.add("actif");
bouton.classList.remove("actif");
bouton.classList.toggle("actif");

const div = document.createElement("div");
div.textContent = "Nouveau !";
document.body.appendChild(div);</code></pre>

<h2>4. Événements</h2>
<pre><code>document.querySelector("form").addEventListener("submit", (e) => {
    e.preventDefault();
    const data = new FormData(e.target);
    console.log(data.get("email"));
});

// Délégation (écouter sur le parent)
document.querySelector("#liste").addEventListener("click", (e) => {
    if (e.target.matches("li")) {
        console.log("Cliqué:", e.target.textContent);
    }
});</code></pre>

<h2>5. Fetch et Async/Await</h2>
<pre><code>async function chargerUtilisateurs() {
    try {
        const response = await fetch("https://jsonplaceholder.typicode.com/users");
        if (!response.ok) throw new Error(\`Erreur HTTP: \${response.status}\`);
        const users = await response.json();
        return users;
    } catch (error) {
        console.error("Erreur réseau:", error);
        return [];
    }
}

async function creerUtilisateur(userData) {
    const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData)
    });
    return response.json();
}</code></pre>

<h2>6. Méthodes de tableaux</h2>
<pre><code>const nb = [1, 2, 3, 4, 5];

nb.map(x => x * 2);                       // [2, 4, 6, 8, 10]
nb.filter(x => x % 2 === 0);              // [2, 4]
nb.reduce((acc, curr) => acc + curr, 0);  // 15
nb.find(x => x > 3);                      // 4
nb.findIndex(x => x > 3);                 // 3
nb.some(x => x > 4);                      // true
nb.every(x => x > 0);                     // true
nb.includes(3);                           // true
nb.sort((a, b) => b - a);                 // Tri décroissant</code></pre>`
      },
      {
        name: "PHP",
        note: `<h1>Cheatsheet PHP — BTS SIO</h1>

<h2>1. Syntaxe de base</h2>
<pre><code>&lt;?php
\$entier  = 42;
\$decimal  = 3.14;
\$chaine  = "Alice";
\$booleen = true;

echo "Bonjour " . \$chaine . " !";
echo "Bonjour \$chaine !";
echo "Age: {\$user['age']}";
?&gt;</code></pre>

<h2>2. Tableaux (Arrays)</h2>
<pre><code>&lt;?php
\$fruits = ["Pomme", "Banane", "Cerise"];
\$fruits[] = "Orange";
\$taille = count(\$fruits);

\$user = [
    "nom"  => "Dupont",
    "age"  => 20,
    "actif" => true
];
echo \$user["nom"];
\$user["email"] = "alice@test.fr";

foreach (\$fruits as \$index => \$fruit) {
    echo "\$index: \$fruit &lt;br&gt;";
}

sort(\$fruits);
array_map(fn(\$f) => strtoupper(\$f), \$fruits);
in_array("Pomme", \$fruits);
?&gt;</code></pre>

<h2>3. Superglobales</h2>
<pre><code>&lt;?php
\$id  = (int) (\$_GET['id'] ?? 0);
\$nom = htmlspecialchars(\$_POST['nom'] ?? '');

\$_SESSION['user_id'];
\$_COOKIE['theme'];
\$_SERVER['REMOTE_ADDR'];
\$_SERVER['REQUEST_METHOD'];
\$_FILES['avatar'];
?&gt;</code></pre>

<h2>4. Sessions</h2>
<pre><code>&lt;?php
session_start();

\$_SESSION['user_id'] = 42;
\$_SESSION['role']    = "admin";

if (isset(\$_SESSION['user_id'])) {
    echo "Connecté : id " . \$_SESSION['user_id'];
}

unset(\$_SESSION['role']);
session_destroy();

setcookie("langue", "fr", time() + (86400 * 30), "/");
\$lang = \$_COOKIE['langue'] ?? 'fr';
?&gt;</code></pre>

<h2>5. Base de données avec PDO</h2>
<pre><code>&lt;?php
\$dsn = "mysql:host=localhost;dbname=monsite;charset=utf8mb4";
\$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    \$pdo = new PDO(\$dsn, "root", "motdepasse", \$options);
} catch (PDOException \$e) {
    error_log(\$e->getMessage());
    die("Erreur de connexion.");
}

// Lecture avec requête préparée (ANTI injection SQL)
\$stmt = \$pdo->prepare("SELECT * FROM users WHERE email = :email AND actif = :actif");
\$stmt->execute(['email' => 'test@test.fr', 'actif' => 1]);

\$user  = \$stmt->fetch();
\$users = \$stmt->fetchAll();

// Insertion
\$stmt = \$pdo->prepare("INSERT INTO users (nom, email) VALUES (:nom, :email)");
\$stmt->execute(['nom' => 'Alice', 'email' => 'alice@test.fr']);
\$newId = \$pdo->lastInsertId();

// Mise à jour
\$stmt = \$pdo->prepare("UPDATE users SET actif = :actif WHERE id = :id");
\$stmt->execute(['actif' => 0, 'id' => 5]);

// Suppression
\$stmt = \$pdo->prepare("DELETE FROM users WHERE id = :id");
\$stmt->execute(['id' => 5]);
?&gt;</code></pre>

<h2>6. POO en PHP</h2>
<pre><code>&lt;?php
abstract class Modele {
    protected PDO \$pdo;
    public function __construct(PDO \$pdo) { \$this->pdo = \$pdo; }
    abstract public function findById(int \$id): ?array;
}

class UserRepository extends Modele {
    public function findById(int \$id): ?array {
        \$stmt = \$this->pdo->prepare("SELECT * FROM users WHERE id = :id");
        \$stmt->execute(['id' => \$id]);
        return \$stmt->fetch() ?: null;
    }

    public function findAll(): array {
        return \$this->pdo->query("SELECT * FROM users")->fetchAll();
    }
}

\$repo = new UserRepository(\$pdo);
\$user = \$repo->findById(1);
?&gt;</code></pre>`
      }
    ]
  },
  {
    folder: "Frameworks",
    subfolders: [
      {
        name: "Symfony",
        note: `<h1>Cheatsheet Symfony — BTS SIO</h1>

<h2>1. Commandes console essentielles</h2>
<pre><code># Serveur de développement
symfony server:start
php bin/console server:run

# Générateurs
php bin/console make:controller NomController
php bin/console make:entity NomEntite
php bin/console make:form NomForm
php bin/console make:crud NomEntite
php bin/console make:user
php bin/console make:auth

# Doctrine
php bin/console doctrine:database:create
php bin/console make:migration
php bin/console doctrine:migrations:migrate
php bin/console doctrine:fixtures:load

# Debug
php bin/console debug:router
php bin/console debug:container</code></pre>

<h2>2. Contrôleur et Routage</h2>
<pre><code>&lt;?php
namespace AppController;

use AppEntityArticle;
use AppRepositoryArticleRepository;
use SymfonyBundleFrameworkBundleControllerAbstractController;
use SymfonyComponentHttpFoundationResponse;
use SymfonyComponentRoutingAnnotationRoute;

#[Route('/articles', name: 'article_')]
class ArticleController extends AbstractController
{
    #[Route('/', name: 'index', methods: ['GET'])]
    public function index(ArticleRepository \$repo): Response
    {
        \$articles = \$repo->findAll();
        return \$this->render('article/index.html.twig', compact('articles'));
    }

    #[Route('/{id}', name: 'show', requirements: ['id' => '\d+'])]
    public function show(Article \$article): Response
    {
        return \$this->render('article/show.html.twig', ['article' => \$article]);
    }

    #[Route('/api', methods: ['GET'])]
    public function api(ArticleRepository \$repo): Response
    {
        return \$this->json(\$repo->findAll());
    }
}
?&gt;</code></pre>

<h2>3. Twig (Moteur de templates)</h2>
<pre><code>{# base.html.twig #}
&lt;!DOCTYPE html&gt;
&lt;html&gt;
&lt;head&gt;&lt;title&gt;{% block title %}Mon site{% endblock %}&lt;/title&gt;&lt;/head&gt;
&lt;body&gt;{% block body %}{% endblock %}&lt;/body&gt;
&lt;/html&gt;

{# article/show.html.twig #}
{% extends 'base.html.twig' %}

{% block title %}{{ article.title }}{% endblock %}

{% block body %}
    &lt;h1&gt;{{ article.title | upper }}&lt;/h1&gt;
    &lt;p&gt;{{ article.createdAt | date('d/m/Y') }}&lt;/p&gt;

    {% if is_granted('ROLE_ADMIN') %}
        &lt;a href="{{ path('article_delete', {id: article.id}) }}"&gt;Supprimer&lt;/a&gt;
    {% endif %}

    {% for comment in article.commentaires %}
        &lt;p&gt;{{ comment.contenu }}&lt;/p&gt;
    {% else %}
        &lt;p&gt;Aucun commentaire.&lt;/p&gt;
    {% endfor %}

    &lt;a href="{{ path('article_index') }}"&gt;Retour&lt;/a&gt;
    &lt;img src="{{ asset('images/logo.png') }}"&gt;
{% endblock %}</code></pre>

<h2>4. Doctrine — Entités et Repository</h2>
<pre><code>&lt;?php
namespace AppEntity;

use DoctrineORMMapping as ORM;

#[ORMEntity(repositoryClass: ArticleRepository::class)]
class Article
{
    #[ORMId, ORMGeneratedValue, ORMColumn]
    private ?int \$id = null;

    #[ORMColumn(length: 200)]
    private string \$titre;

    #[ORMColumn(type: 'text', nullable: true)]
    private ?string \$contenu;

    #[ORMColumn]
    private DateTimeImmutable \$createdAt;

    #[ORMManyToOne(targetEntity: Auteur::class, inversedBy: 'articles')]
    private ?Auteur \$auteur;
}

// Repository avec requête personnalisée
class ArticleRepository extends ServiceEntityRepository
{
    public function findRecents(int \$nb = 5): array
    {
        return \$this->createQueryBuilder('a')
            ->orderBy('a.createdAt', 'DESC')
            ->setMaxResults(\$nb)
            ->getQuery()
            ->getResult();
    }
}
?&gt;</code></pre>

<h2>5. Sécurité</h2>
<pre><code>&lt;?php
#[Route('/admin')]
public function admin(): Response
{
    \$this->denyAccessUnlessGranted('ROLE_ADMIN');

    \$user = \$this->getUser(); // L'utilisateur connecté
    return \$this->render('admin/index.html.twig');
}
?&gt;</code></pre>`
      },
      {
        name: "Bootstrap",
        note: `<h1>Cheatsheet Bootstrap 5 — BTS SIO</h1>

<h2>1. Installation CDN</h2>
<pre><code>&lt;!-- Dans le &lt;head&gt; --&gt;
&lt;link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css"&gt;

&lt;!-- Avant &lt;/body&gt; --&gt;
&lt;script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"&gt;&lt;/script&gt;</code></pre>

<h2>2. Grille (12 colonnes)</h2>
<pre><code>&lt;div class="container"&gt;
    &lt;div class="row g-3"&gt;
        &lt;div class="col-12 col-md-6 col-lg-4"&gt;Carte 1&lt;/div&gt;
        &lt;div class="col-12 col-md-6 col-lg-4"&gt;Carte 2&lt;/div&gt;
        &lt;div class="col"&gt;S'adapte automatiquement&lt;/div&gt;
    &lt;/div&gt;
&lt;/div&gt;
&lt;div class="container-fluid"&gt;Pleine largeur&lt;/div&gt;</code></pre>

<h2>3. Utilitaires d'espacement</h2>
<p>Format : <strong>propriété + côté + taille</strong></p>
<ul>
  <li>Propriété : m (margin), p (padding)</li>
  <li>Côté : t, b, s (start=left), e (end=right), x (H), y (V)</li>
  <li>Taille : 0-5 ou auto (3 = 1rem)</li>
</ul>
<pre><code>&lt;div class="mt-3 mb-5 py-2 px-4 ms-auto"&gt;...&lt;/div&gt;</code></pre>

<h2>4. Couleurs</h2>
<pre><code>&lt;p class="text-primary"&gt;Bleu&lt;/p&gt;
&lt;p class="text-success"&gt;Vert&lt;/p&gt;
&lt;p class="text-danger"&gt;Rouge&lt;/p&gt;
&lt;p class="text-warning"&gt;Jaune&lt;/p&gt;
&lt;p class="text-muted"&gt;Gris&lt;/p&gt;
&lt;div class="bg-dark text-white"&gt;Fond sombre&lt;/div&gt;</code></pre>

<h2>5. Composants</h2>
<pre><code>&lt;button class="btn btn-primary"&gt;Valider&lt;/button&gt;
&lt;button class="btn btn-outline-danger btn-sm"&gt;Petit rouge creux&lt;/button&gt;
&lt;button class="btn btn-success w-100"&gt;Pleine largeur&lt;/button&gt;

&lt;div class="alert alert-success alert-dismissible fade show"&gt;
    Enregistrement réussi !
    &lt;button type="button" class="btn-close" data-bs-dismiss="alert"&gt;&lt;/button&gt;
&lt;/div&gt;

&lt;div class="card shadow"&gt;
    &lt;div class="card-body"&gt;
        &lt;h5 class="card-title"&gt;Titre&lt;/h5&gt;
        &lt;p class="card-text"&gt;Description&lt;/p&gt;
        &lt;a href="#" class="btn btn-primary"&gt;Action&lt;/a&gt;
    &lt;/div&gt;
&lt;/div&gt;

&lt;button data-bs-toggle="modal" data-bs-target="#maModale"&gt;Ouvrir&lt;/button&gt;
&lt;div class="modal fade" id="maModale" tabindex="-1"&gt;
    &lt;div class="modal-dialog"&gt;
        &lt;div class="modal-content"&gt;
            &lt;div class="modal-header"&gt;
                &lt;h5 class="modal-title"&gt;Titre&lt;/h5&gt;
                &lt;button class="btn-close" data-bs-dismiss="modal"&gt;&lt;/button&gt;
            &lt;/div&gt;
            &lt;div class="modal-body"&gt;Contenu&lt;/div&gt;
            &lt;div class="modal-footer"&gt;
                &lt;button class="btn btn-secondary" data-bs-dismiss="modal"&gt;Annuler&lt;/button&gt;
                &lt;button class="btn btn-primary"&gt;Confirmer&lt;/button&gt;
            &lt;/div&gt;
        &lt;/div&gt;
    &lt;/div&gt;
&lt;/div&gt;</code></pre>`
      }
    ]
  },
  {
    folder: "Linux",
    subfolders: [
      {
        name: "Commandes",
        note: `<h1>Cheatsheet Commandes Linux — BTS SIO</h1>

<h2>1. Navigation et Gestion des Fichiers</h2>
<pre><code>pwd                            # Afficher le dossier actuel
ls -lah                        # -l détails, -a cachés, -h taille lisible
cd /var/log                    # Dossier absolu
cd ..                          # Remonter
cd ~                           # Dossier personnel
cd -                           # Dossier précédent

mkdir -p /a/b/c                # Créer dossiers imbriqués
touch fichier.txt              # Créer un fichier vide
cp -r source/ dest/            # Copier récursivement
mv ancien.txt nouveau.txt      # Déplacer ou renommer
rm -rf dossier/                # Supprimer récursivement (DANGEREUX)
ln -s /chemin/reel lien        # Lien symbolique</code></pre>

<h2>2. Lire et Chercher</h2>
<pre><code>cat fichier.txt
less fichier.txt               # Paginé (q pour quitter)
head -20 fichier.txt           # 20 premières lignes
tail -50 fichier.txt           # 50 dernières lignes
tail -f /var/log/syslog        # Suivre en temps réel

grep "erreur" fichier.txt      # Chercher un mot
grep -i "Erreur" fic.txt       # Insensible à la casse
grep -r "todo" /var/www/       # Récursif dans des dossiers
grep -n "erreur" fic.txt       # Avec numéros de lignes
grep -v "debug" fichier.txt    # Lignes sans "debug"

find / -name "*.log" -type f   # Chercher des fichiers
find /var -size +100M          # Fichiers > 100Mo
find . -mtime -7               # Modifiés il y a moins de 7 jours

wc -l fichier.txt              # Compter les lignes</code></pre>

<h2>3. Permissions</h2>
<pre><code># r=4, w=2, x=1 — Ordre: Propriétaire | Groupe | Autres
chmod 755 script.sh    # rwxr-xr-x
chmod 644 fichier.txt  # rw-r--r--
chmod 600 .ssh/id_rsa  # rw------- (Clé privée SSH)
chmod -R 755 /var/www/

chmod u+x script.sh    # Ajouter exécution au propriétaire
chmod g-w fichier.txt  # Retirer écriture au groupe

chown alice fichier.txt
chown alice:www-data fichier.txt
chown -R www-data:www-data /var/www/html</code></pre>

<h2>4. Processus et Services</h2>
<pre><code>ps aux                     # Tous les processus
ps -ef | grep nginx
top                        # Gestionnaire de tâches (q pour quitter)
htop                       # Version améliorée

kill 1234                  # Arrêt propre (SIGTERM)
kill -9 1234               # Arrêt forcé (SIGKILL)
killall nginx

systemctl status nginx
systemctl start nginx
systemctl stop nginx
systemctl restart nginx
systemctl enable nginx     # Au démarrage
systemctl disable nginx

ma_commande &amp;              # Background
nohup ma_commande &amp;        # Persiste si déconnexion
jobs                       # Lister les jobs en background
fg 1                       # Ramener au premier plan</code></pre>

<h2>5. Réseau</h2>
<pre><code>ip a                       # Interfaces et IPs
ip route                   # Table de routage
ping 8.8.8.8               # Tester la connectivité
traceroute google.com

ss -tulnp                  # Ports ouverts (moderne)
netstat -tulnp             # Ancienne version

curl -o fichier.zip "http://exemple.com/fichier.zip"
curl -X POST -d "param=val" http://api.com
wget http://exemple.com/fichier.zip

ssh alice@192.168.1.10
ssh -p 2222 alice@serveur.com
scp fichier.txt alice@serv:/home/alice/
scp -r dossier/ alice@serv:/home/alice/</code></pre>

<h2>6. Archives et Paquets</h2>
<pre><code>tar -czvf archive.tar.gz dossier/   # Créer
tar -xzvf archive.tar.gz            # Extraire
tar -tzvf archive.tar.gz            # Lister

apt update
apt upgrade
apt install nom-du-paquet
apt remove nom-du-paquet
apt search php</code></pre>`
      }
    ]
  },
  {
    folder: "Système",
    subfolders: [
      {
        name: "Architecture et Processus",
        note: `<h1>Cheatsheet Architecture Système — BTS SIO</h1>

<h2>1. Architecture Matérielle (Von Neumann)</h2>
<p>Tout ordinateur moderne repose sur 4 composants reliés par des bus :</p>
<ul>
<li><strong>CPU (Processeur)</strong> : Le cerveau.
  <ul>
    <li><em>UAL</em> (Unité Arithmétique et Logique) : calculs (+, -, *, /, ET, OU...)</li>
    <li><em>Unité de Contrôle</em> : décode et ordonne les instructions (cycle Fetch-Decode-Execute)</li>
    <li><em>Registres</em> : mémoire interne ultra-rapide (ex: compteur ordinal, accumulateur)</li>
  </ul>
</li>
<li><strong>RAM (Mémoire vive)</strong> : Volatile (effacée hors tension), rapide, stocke programmes + données en cours.</li>
<li><strong>Stockage secondaire</strong> : HDD/SSD — persistant mais lent. Capacité : centaines de Go à plusieurs To.</li>
<li><strong>Entrées/Sorties</strong> : Clavier, écran, carte réseau, imprimante...</li>
</ul>

<h2>2. Les Bus</h2>
<ul>
<li><strong>Bus d'adresses</strong> : Indique <em>où</em> lire ou écrire. Unidirectionnel. Sa taille en bits détermine la RAM max adressable (32 bits = 4 Go max).</li>
<li><strong>Bus de données</strong> : Transporte <em>la donnée</em>. Bidirectionnel. Sa largeur (64 bits) = volume transféré à chaque cycle.</li>
<li><strong>Bus de contrôle</strong> : Transporte les commandes (lecture/écriture, horloge, interruptions). Bidirectionnel.</li>
</ul>

<h2>3. Hiérarchie des Mémoires</h2>
<p>Plus haut = plus rapide, plus cher, plus petit :</p>
<ol>
<li>Registres CPU — nanosecondes, quelques dizaines d'octets</li>
<li>Cache L1 / L2 / L3 — intégré au CPU, quelques Mo</li>
<li>RAM — dizaines de nanosecondes, 8 à 64 Go</li>
<li>SSD (NVMe) — microsecondes, centaines de Go</li>
<li>Disque Dur (HDD) — millisecondes, 1+ To</li>
<li>Stockage en ligne — secondes, illimité</li>
</ol>

<h2>4. Les Processus</h2>
<p>Un <strong>processus</strong> est l'instance active d'un programme. Chaque processus a : un PID unique, un espace mémoire virtuel isolé, des descripteurs de fichiers.</p>

<h3>États d'un processus</h3>
<ul>
<li><strong>Prêt (Ready)</strong> : Attend que le CPU soit libre.</li>
<li><strong>Élu (Running)</strong> : S'exécute sur le CPU.</li>
<li><strong>Bloqué (Waiting)</strong> : Attend un événement (lecture disque, saisie réseau). Libère le CPU.</li>
<li><strong>Zombie</strong> : Terminé mais le processus parent n'a pas encore lu son code de retour.</li>
</ul>

<h2>5. Ordonnancement (Scheduling)</h2>
<ul>
<li><strong>FIFO</strong> : Premier arrivé, premier servi. Simple mais bloquant.</li>
<li><strong>SJF</strong> (Shortest Job First) : Le plus court d'abord. Optimal mais difficile à prédire.</li>
<li><strong>Round-Robin</strong> : Chaque processus dispose d'un quantum de temps (ex: 10ms). Équitable. Utilisé sur les OS modernes.</li>
<li><strong>Priorités</strong> : Numéro de priorité. Risque de famine pour les basses priorités.</li>
</ul>

<h2>6. Threads et Concurrence</h2>
<p>Un <strong>Thread</strong> est une unité d'exécution à l'intérieur d'un processus.</p>
<ul>
<li>Les threads d'un même processus <strong>partagent</strong> la même mémoire (heap, variables globales).</li>
<li>Chaque thread a sa propre <strong>pile (stack)</strong> pour ses variables locales.</li>
<li><strong>Race Condition</strong> : Bug si deux threads modifient la même variable simultanément.</li>
</ul>
<p><strong>Solutions :</strong></p>
<ul>
<li><strong>Mutex</strong> : Verrou — un seul thread à la fois dans la section critique.</li>
<li><strong>Sémaphore</strong> : Comme un mutex mais peut autoriser N accès simultanés.</li>
</ul>

<h2>7. Gestion de la Mémoire</h2>
<ul>
<li><strong>Mémoire Virtuelle</strong> : L'OS donne à chaque processus l'illusion d'avoir toute la mémoire. La MMU traduit les adresses virtuelles en adresses physiques.</li>
<li><strong>Pagination</strong> : La RAM est divisée en cadres de taille fixe (4 Ko). La mémoire virtuelle est divisée en pages de même taille. Une table des pages fait la correspondance.</li>
<li><strong>Défaut de page</strong> : La page n'est pas en RAM, l'OS doit la charger depuis le disque.</li>
<li><strong>Swapping / Thrashing</strong> : Si la RAM est pleine, l'OS swap des pages sur disque. Si trop fréquent, le système est en Thrashing (bloqué à swapper).</li>
</ul>`
      }
    ]
  }
];

/*
    Santiago André Vital Betanzos
    Universidad Autónoma de Aguascalientes
    Ing. en Computación Inteligente
    3° Semestre

    Dr. en C. Luis Fernando Gutiérrez Marfileño
    Estructuras Computacionales Avanzadas

    Programa que crea un árbol binario y realiza los recorridos
    preorden, inorder y postorden
*/

// Árbol binario
var tree;

var randVal;
var randList = [];
var notAdded;

var treePath = [];
var preordPath = '';
var inordPath = '';
var postordPath = '';


function setup() {
  createCanvas(900, 700);

  // Nuevo árbol
  tree = new Tree();

  // Agregar 10 valores aleatorios
  for (var i = 0; i < 10; i++) {
    notAdded = true;
    randVal = floor(random(0, 100));

    for(let j = 0; j <= i && notAdded; j++){
      if(randList[j] == randVal) {
        notAdded = false;
        randVal = floor(random(0, 100));
      }
    }

    randList.push(randVal);

    tree.addValue(randVal);
  }

  background(51);

  // Recorrer el árbol
  tree.traverse();

  treePath = tree.root.preorder(tree.root);
  treePath = tree.root.inorder(tree.root);
  treePath = tree.root.postorder(tree.root);

  for(let i = 0; i < 10; i++){
    preordPath += treePath[i];
    if(i < 9) preordPath += " > ";
  }

  for(let i = 10; i < 20; i++){
    inordPath += treePath[i];
    if(i < 19) inordPath += " > ";
  }

  for(let i = 20; i < 30; i++){
    postordPath += treePath[i];
    if(i < 29) postordPath += " > ";
  }

  document.getElementById("preordPath").innerHTML = preordPath;
  document.getElementById("inordPath").innerHTML = inordPath;
  document.getElementById("postordPath").innerHTML = postordPath;
}
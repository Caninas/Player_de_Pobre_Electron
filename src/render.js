const fs = require('fs');
const jsmediatags = require('jsmediatags');
const { ipcRenderer } = require('electron');
const path = require('path');
const { getSessaoPassada, setSessaoPassada } = require("./settings");
const { time } = require('console');


var cover_album = document.getElementById("cover_album")
var nome_musica = document.getElementById("nome_musica")
var artista = document.getElementById("artista")

var lista_playlists = document.getElementById("lista_playlists")
var lista_musicas = document.getElementById("lista_musicas")

var slider_musica = document.getElementById("slider_musica")
var slider_volume = document.getElementById("slider_volume")
var duraçao_slider = document.getElementById("duraçao_slider")

var botao_play = document.getElementById("play")
var fundo_random = document.getElementById("div-random")
var fundo_loop = document.getElementById("div-loop")

var audio = document.getElementById("audio")
audio.volume = 0.5
slider_volume.value = 50
slider_musica.value = 0

// variaveis
var diretorio = []
var pasta_playlists = ""
var pasta_selecionada = ""
var playlists = ""

var indice_loaded = 0
var indices_passados = []
var cursor = 0

var aleatorio = 0
var _loop = 0

var cache = {}

// article (musica selecionada), usado para tirar a borda apos mudar a musica
var article
var timer

// eventos
navigator.mediaSession.metadata = new MediaMetadata()
navigator.mediaSession.setActionHandler('play', tocar)
navigator.mediaSession.setActionHandler('pause', tocar)
navigator.mediaSession.setActionHandler('stop', tocar)
navigator.mediaSession.setActionHandler('previoustrack', anterior)
navigator.mediaSession.setActionHandler('nexttrack', proximo)

slider_volume.addEventListener("input", volume)
slider_musica.addEventListener("input", seek)
audio.addEventListener("ended", proximo)
botao_play.addEventListener("click", tocar)
document.getElementById("ant").addEventListener("click", anterior)
document.getElementById("prox").addEventListener("click", proximo)
document.getElementById("loop").addEventListener("click", loop)
document.getElementById("random").addEventListener("click", random)

//carregar_sessao()

function volume(objeto) {
   audio.volume = objeto.srcElement.value / 100
   slider_volume.style.backgroundSize = `${objeto.srcElement.value}% 100%`
}

function seek(objeto) {
   audio.currentTime = (objeto.srcElement.value / 100) * audio.duration
   update_slider()
}

function update_slider() {
   const { duration, currentTime } = audio
   slider_musica.value = `${(currentTime / duration) * 100}`
   //slider_thumb.left = `${7.5 - ((currentTime / duration) * 15)}px`
   //${(slider_musica.value / 10) - ((7.5 - ((currentTime / duration) * 15))*6.66666)}
   slider_musica.style.backgroundSize = `${(currentTime / duration) * 100}% 100%` // mudar para div

   duraçao_slider.innerHTML = `${Math.trunc(currentTime / 60)}:${("0" + Math.trunc(currentTime % 60)).slice(-2)}/${Math.trunc(duration / 60)}:${("0" + Math.trunc(duration % 60)).slice(-2)}`
}

function loop() {
   if (audio.src != "") {
      if (_loop == 0) {
         _loop = 1
         audio.loop = true
         fundo_loop.style.backgroundColor = "brown"
      } else {
         _loop = 0
         audio.loop = false
         fundo_loop.style.backgroundColor = ""
      }
   }
}

function random() {
   if (aleatorio == 0) {
      aleatorio = 1
      fundo_random.style.backgroundColor = "brown"
   } else {
      aleatorio = 0
      fundo_random.style.backgroundColor = ""
   }
   //setSessaoPassada(pasta_playlists, pasta_selecionada, indice_loaded,
     // indices_passados, cursor, aleatorio, cache)
}

function atualizar_tela_musica(indice = indice_loaded) { // pegar direto da tela
   var path_diretorio = path.join(pasta_playlists, pasta_selecionada, diretorio[indice])

   jsmediatags.read(path_diretorio, {
      onSuccess: function (tag) {
         navigator.mediaSession.metadata.title = tag.tags.title
         nome_musica.innerHTML = tag.tags.title

         if (tag.tags.artist == undefined) {
            navigator.mediaSession.metadata.artist = ""
            artista.innerHTML = ""
         } else {
            navigator.mediaSession.metadata.artist = tag.tags.artist
            artista.innerHTML = tag.tags.artist
         }

         try {
            const { data, format } = tag.tags.picture;

            let stringB64 = Buffer.from(data, "base64")           // conversao do array do array de dados da imagem e 
            stringB64 = `data:${format};base64,${stringB64.toString('base64')}`
            cover_album.src = stringB64; // converter para string
            navigator.mediaSession.metadata.artwork = [{ src: stringB64 }]
         } catch (error) {
            cover_album.src = 'icons/padrao.png'
         }
      },
      onError: function (error) {
         cover_album.src = 'icons/padrao.png'
         nome_musica.innerHTML = diretorio[indice].split(".").slice(0, -1).join(".")
         navigator.mediaSession.metadata.title = nome_musica.innerHTML

         artista.innerHTML = ""
         navigator.mediaSession.metadata.artist = ""
         console.log("error: " + error.type, error.info)
      }
   })
}

async function selecionar_pasta() {
   return await ipcRenderer.invoke("browse_pasta") // dialog so pode ser usado no main
}

function listar_playlists(selecionar = true) {
   if (selecionar) {
      selecionar_pasta().then((pasta) => {
         if (pasta != undefined) {
            lista_playlists.innerHTML = ""
            pasta_playlists = pasta[0]
            console.log(pasta_playlists)

            playlists = fs.readdirSync(pasta_playlists, { withFileTypes: true }) // botar para ler apenas diretorios
               .filter(arquivo => arquivo.isDirectory())
               .map(arquivo => arquivo.name)

            for (let i of playlists) {
               let item = document.createElement("li")
               let texto = document.createElement("p")
               texto.innerHTML = i
               texto.setAttribute("class", "playlist")
               item.setAttribute("onclick", "selecionar_playlist(this)")
               item.appendChild(texto)

               lista_playlists.appendChild(item)
            }
         }
         setSessaoPassada(pasta_playlists, pasta_selecionada, indice_loaded, indices_passados, cursor, aleatorio, cache)

      }
      )}
   // } else {
   //    lista_playlists.innerHTML = ""
   //    console.log(pasta_playlists)

   //    playlists = fs.readdirSync(pasta_playlists, { withFileTypes: true }) // botar para ler apenas diretorios
   //       .filter(arquivo => arquivo.isDirectory())
   //       .map(arquivo => arquivo.name)

   //    for (let i of playlists) {
   //       let item = document.createElement("li")
   //       let texto = document.createElement("p")
   //       texto.innerHTML = i
   //       texto.setAttribute("class", "playlist")
   //       item.setAttribute("onclick", "selecionar_playlist(this)")
   //       item.appendChild(texto)

   //       lista_playlists.appendChild(item)
   //    }
   // }
}

function objeto_elementos(objeto_pai) {
   let obj = {};
   obj.nome = objeto_pai.localName;
   obj.atributos = [];
   obj.children = [];
   Array.from(objeto_pai.attributes).forEach(a => {
      obj.atributos.push({ nome: a.name, valor: a.value });
   });
   Array.from(objeto_pai.children).forEach(filho => {
      obj.children.push(objeto_elementos(filho));
   });

   return obj;
}

function selecionar_playlist(botao = pasta_selecionada) {
   if (pasta_selecionada != botao.firstChild.innerHTML) {
      pasta_selecionada = botao.firstChild.innerHTML

      lista_musicas.innerHTML = ""
      document.getElementById("cabeçalho_musicas").hidden = false
      let tempo = performance.now()

      Array.from(lista_playlists.childNodes).forEach(li => {
         if (li != botao) {
            li.setAttribute("class", "disabled")
            if (li.firstChild.className == "playlist texto_active") {
               li.firstChild.setAttribute("class", "playlist")
            }
         }
      })

      if (!(pasta_selecionada in cache)) {
         botao.firstChild.setAttribute("class", "playlist texto_active")

         diretorio = fs.readdirSync(path.join(pasta_playlists, pasta_selecionada), { withFileTypes: true }) //apenas musicas
            .filter(arquivo => arquivo.isFile() && [".MP3", ".M4A", ".AAC", ".FLAC", ".OGG", ".OGA", ".DOLBY", ".WAV", ".CAF", ".OPUS", ".WEBA"].includes(path.extname(arquivo.name).toUpperCase()))
            .map(arquivo => path.join(arquivo.name))
         // .sort(function (a, b) {
         //    if (fs.statSync(path.join(pasta_playlists, pasta_selecionada) + "/" + a).birthtime < fs.statSync(path.join(pasta_playlists, pasta_selecionada) + "/" + b).birthtime) {
         //       return 1
         //    } else {
         //       return -1
         //    }
         // })           em ordem de criação, mais novo > mais velho

         let caminho = path.join(pasta_playlists, pasta_selecionada)

         let frag = document.createDocumentFragment()

         console.log(performance.now() - tempo)
         async function listar_musicas(diretorio) {            //! melhorar desempenho
            for (let [i, elemento] of diretorio.entries()) {
               console.log(i)

               let linha = document.createElement("article")
               linha.addEventListener("dblclick", tocar_especifica_clique) // tirar listener daqui, colocar dbclick global e checar elemento clicado
               linha.setAttribute("id", i)

               let img = document.createElement("img")
               img.setAttribute("class", "img")

               let nome_musica = document.createElement("p")
               nome_musica.setAttribute("class", "nome_musicas texto_padrao")

               let ext = document.createElement("p")
               ext.setAttribute("class", "extensao texto_padrao")
               ext.innerHTML = path.extname(elemento).toUpperCase()

               await new Promise((resolve) => {
                  jsmediatags.read(path.join(caminho, elemento), {
                     onSuccess: tag => {
                        let album = document.createElement("p")
                        album.setAttribute("class", "album texto_padrao")

                        let artista = document.createElement("p")
                        artista.setAttribute("class", "artista texto_padrao")

                        try {
                           const { data, format } = tag.tags.picture;
                           let stringB64 = Buffer.from(data)           // conversao do array do array de dados da imagem e 
                           img.src = `data:${format};base64,${stringB64.toString('base64')}`; // converter para string
                        } catch (error) {
                           img.src = 'icons/padrao.png'
                           //console.log("musica sem imagem:", tag.tags.title)
                        }

                        nome_musica.innerHTML = tag.tags.title
                        artista.innerHTML = tag.tags.artist
                        album.innerHTML = tag.tags.album


                        nome_musica.appendChild(artista)
                        linha.appendChild(img)
                        linha.appendChild(nome_musica)
                        linha.appendChild(album)
                        linha.appendChild(ext)
                        frag.appendChild(linha)

                        resolve()
                     },
                     onError: error => {
                        img.src = 'icons/padrao.png'

                        nome_musica.innerHTML = elemento.split(".").slice(0, -1).join(".")

                        linha.appendChild(img)
                        linha.appendChild(nome_musica)
                        linha.appendChild(document.createElement("p"))
                        linha.appendChild(ext)
                        frag.appendChild(linha)

                        console.log("error: " + error.type, error.info)
                        resolve()
                     }
                  }
                  )
                  if (i % 20 == 0) {
                     lista_musicas.appendChild(frag)
                  }
               })
            }
            lista_musicas.appendChild(frag)
            //cache[`${pasta_selecionada}`] = [objeto_elementos(lista_musicas), diretorio]
            console.log(lista_musicas.childNodes)
            Array.from(lista_playlists.childNodes).forEach(li => {
               if (li != botao) { li.setAttribute('class', '') }
            })
            //setSessaoPassada(pasta_playlists, pasta_selecionada, indice_loaded,
              // indices_passados, cursor, aleatorio, cache) //CACHE lista_musicas.children NAO ESTA FICANDO
         }
         listar_musicas(diretorio)}
      // } else {
      //    botao.firstChild.setAttribute("class", "playlist texto_active")
      //    diretorio = cache[`${pasta_selecionada}`][1]
      //    for (elemento of cache[`${pasta_selecionada}`][0]) {
      //       lista_musicas.appendChild(elemento)
      //    }

      //    Array.from(lista_playlists.childNodes).forEach(li => {
      //       if (li != botao) { li.setAttribute('class', '') }
      //    })
      // }
      
   }
}

async function background() {

}

function carregar_sessao() {
   if (getSessaoPassada() != 0) {
      ({
         pasta_playlists, pasta_selecionada, indice_loaded,
         indices_passados, cursor, aleatorio, cache
      } = getSessaoPassada())
      listar_playlists(false)
   }
}

function carregar_musica(indice = indice_loaded) {
   clearInterval(timer)

   if (diretorio[indice] == undefined) {
      indice = 0
      indice_loaded = 0
   }
   audio.src = path.join(pasta_playlists, pasta_selecionada, diretorio[indice])

   timer = setInterval(update_slider, 1000)
   atualizar_tela_musica(indice)
}

function tocar_especifica() {
   carregar_musica(indice_loaded)

   if (article != undefined) {
      article.setAttribute("class", "")
   }
   article = document.getElementById(`${indice_loaded}`)
   article.setAttribute("class", "musica_active")

   botao_play.src = "icons/pause.svg"
   audio.play()
   //setSessaoPassada(pasta_playlists, pasta_selecionada, indice_loaded,
     // indices_passados, cursor, aleatorio, cache)
}

function tocar_especifica_clique(objeto) {
   indices_passados = []
   cursor = 0

   if (article != undefined) {
      article.setAttribute("class", "")
   }
   article = objeto.target.closest("article")
   article.setAttribute("class", "musica_active")
   indice_loaded = Number(article.id)

   indices_passados.push(indice_loaded)

   carregar_musica(indice_loaded)

   botao_play.src = "icons/pause.svg"

   audio.play()
  // setSessaoPassada(pasta_playlists, pasta_selecionada, indice_loaded,
    //  indices_passados, cursor, aleatorio, cache)
}

function tocar() {    // botao play
   if (diretorio.length != 0) {
      let botao_src = botao_play.src.split("/").slice(-1)[0]

      if (botao_src == "play.svg") {
         botao_play.src = "icons/pause.svg"

         if (audio.src != "") {
            audio.play()
         } else {
            if (aleatorio == 0) {
               tocar_especifica()

            } else {
               indice_loaded = Math.floor(Math.random() * diretorio.length)
               indices_passados.push(indice_loaded)
               tocar_especifica()
            }

         }
      } else {
         botao_play.src = "icons/play.svg"
         audio.pause()
      }
   }
}

function anterior() {                // botao anterior
   if (diretorio != 0) {
      if (audio.src == "") {
         tocar()
      } else {

         botao_play.src = "icons/pause.svg"


         if (aleatorio == 0) {
            indice_loaded -= 1
            tocar_especifica()
            if (indices_passados != []) {
               cursor = 0
               indices_passados = [indice_loaded]
            }

         } else {
            if (cursor != 0) {
               cursor -= 1
               indice_loaded = indices_passados[cursor]
            } else {
               indice_loaded = Math.floor(Math.random() * diretorio.length)
               indices_passados.unshift(indice_loaded)
            }
            tocar_especifica()
         }

      }
   }
}

function proximo() {                             // botao proximo
   if (diretorio != 0) {
      if (audio.src == "") {
         tocar_especifica()
      } else {
         botao_play.src = "icons/pause.svg"

         if (aleatorio == 0) {                                 //nao-aleatorio
            if (indice_loaded == diretorio.length - 1) {
               indice_loaded = 0
            } else {
               indice_loaded += 1
            }
            if (indices_passados != []) {
               cursor = 0
               indices_passados = [indice_loaded]
            }

            tocar_especifica()

         } else {                                                  //aleatorio
            if (indices_passados.length > 1 && cursor != indices_passados.length - 1) {
               cursor += 1
               indice_loaded = indices_passados[cursor]
            } else if (indices_passados.length == 0) {
               indice_loaded = Math.floor(Math.random() * diretorio.length)
               indices_passados.push(indice_loaded)

            } else {
               cursor += 1
               indice_loaded = Math.floor(Math.random() * diretorio.length)
               indices_passados.push(indice_loaded)
            }
            console.log(indice_loaded)
            tocar_especifica()

         }
      }
   }
}

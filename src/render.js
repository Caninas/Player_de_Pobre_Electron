const fs = require('fs');
const jsmediatags = require('jsmediatags');
const { ipcRenderer } = require('electron');
const path = require('path');


var artista = document.getElementById("artista")
var nome_musica = document.getElementById("nome_musica")
var cover_album = document.getElementById("cover_album")
var lista_playlists = document.getElementById("lista_playlists")
var lista_musicas = document.getElementById("lista_musicas")
var audio = document.getElementById("audio")
var slider_musica = document.getElementById("slider_musica")
var slider_volume = document.getElementById("slider_volume")
var duraçao_slider = document.getElementById("duraçao_slider")

audio.addEventListener("ended", proximo)
audio.volume = 0.5

slider_volume.addEventListener("input", volume)
slider_volume.value = 50
slider_musica.addEventListener("input", seek)
slider_musica.value = 0

var botao_play = document.getElementById("play")
var fundo_random = document.getElementById("div-random")
var fundo_loop = document.getElementById("div-loop")

var diretorio = []
var pasta_playlists = ""
var pasta_selecionada = ""
var playlists = ""

var indice_loaded = 0
var indices_passados = []
var cursor = 0

var aleatorio = 0
var _loop = 0

var article
var timer

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
}

function atualizar_tela_musica(indice = indice_loaded) { // pegar direto da tela
   var path_diretorio = path.join(pasta_playlists, pasta_selecionada, diretorio[indice])
   jsmediatags.read(path_diretorio, {
      onSuccess: function (tag) {
         nome_musica.innerHTML = tag.tags.title
         if ( tag.tags.artist == undefined){
            artista.innerHTML = ""
         } else {
            artista.innerHTML = tag.tags.artist
         }

         try {
            const { data, format } = tag.tags.picture;
            let stringB64 = Buffer.from(data)           // conversao do array do array de dados da imagem e 
            cover_album.src = `data:${format};base64,${stringB64.toString('base64')}`; // converter para string
         } catch (error) {
            cover_album.src = 'icons/padrao.png'
         }

      },
      onError: function (error) {
         cover_album.src = 'icons/padrao.png'
         nome_musica.innerHTML = path_diretorio.split("\\").slice(-1)[0].split(".").slice(0, -1).join(".") //!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
         artista.innerHTML = ""
         console.log("error: " + error.type, error.info)
      }
   })
}

async function selecionar_pasta() {
   return await ipcRenderer.invoke("browse_pasta") // dialog so pode ser usado no main
}

function listar_playlists() {
   selecionar_pasta().then(pasta => {
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
   }
   )
}

function selecionar_playlist(botao) {
   if (pasta_selecionada != botao.firstChild.innerHTML) {
      Array.from(lista_playlists.childNodes).forEach(li => {
         if (li != botao) {
            li.setAttribute("class", "disabled")
            if (li.firstChild.className == "playlist texto_active") {
               li.firstChild.setAttribute("class", "playlist")
            }
         }
      })

      document.getElementById("cabeçalho_musicas").hidden = false

      botao.firstChild.setAttribute("class", "playlist texto_active")
      lista_musicas.innerHTML = ""

      pasta_selecionada = botao.firstChild.innerHTML

      diretorio = fs.readdirSync(path.join(pasta_playlists, pasta_selecionada), { withFileTypes: true }) //apenas musicas
         .filter(arquivo => arquivo.isFile() && [".MP3", ".M4A", ".AAC", ".FLAC", ".OGG", ".OGA", ".DOLBY", ".WAV", ".CAF", ".OPUS", ".WEBA"].includes(path.extname(arquivo.name).toUpperCase()))
         .map(arquivo => path.join(arquivo.name))


      let caminho = path.join(pasta_playlists, pasta_selecionada)

      async function listar_musicas(diretorio) {            //! melhorar desempenho
         for (let [i, elemento] of diretorio.entries()) {
            console.log(i)
            let linha = document.createElement("article")
            linha.addEventListener("dblclick", tocar_especifica_clique)
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

                     lista_musicas.appendChild(linha)

                     resolve()
                  },
                  onError: error => {
                     img.src = 'icons/padrao.png'

                     nome_musica.innerHTML = elemento.split(".").slice(0, -1).join(".")

                     linha.appendChild(img)
                     linha.appendChild(nome_musica)
                     linha.appendChild(document.createElement("p"))
                     linha.appendChild(ext)
                     lista_musicas.appendChild(linha)

                     console.log("error: " + error.type, error.info)
                     resolve()
                  }
               }
               )
            })
         }
         Array.from(lista_playlists.childNodes).forEach(li => {
            if (li != botao) { li.setAttribute('class', '') }})
      }
      listar_musicas(diretorio)
   }
}

async function background() {

}

function carregar_sessao() {

}

function carregar_musica(indice = indice_loaded) {
   clearInterval(timer)
   audio.src = path.join(pasta_playlists, pasta_selecionada, diretorio[indice])

   timer = setInterval(update_slider, 1000)
   // audio = new howler.Howl({
   //   src: [path.join(pasta_playlists, pasta_selecionada, diretorio[indice])],
   //   html5: true,
   // })
   atualizar_tela_musica(indice)
}

function tocar_especifica() {
   carregar_musica(indice_loaded)

   if (article != undefined){
      article.setAttribute("class", "")
   }
   article = document.getElementById(`${indice_loaded}`)
   article.setAttribute("class", "musica_active")

   botao_play.src = "icons/pause.svg"
   audio.play()
}

function tocar_especifica_clique(objeto) {
   indices_passados = []
   cursor = 0

   if (article != undefined){
      article.setAttribute("class", "")
   }
   article = objeto.target.closest("article")
   article.setAttribute("class", "musica_active")
   
   indice_loaded = Number(article.id)
   
   carregar_musica(indice_loaded)

   botao_play.src = "icons/pause.svg"

   audio.play()
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

const fs = require('fs');
const jsmediatags = require('jsmediatags');
const { ipcRenderer } = require('electron');
const path = require('path');
const { setPathPassada, getPathPassada, setVars, getVars, setState, getState, setPos, getPos, getFileStatus, setVol, getVol,
      } = require("./settings"); //setPrefs, getPrefs, getID, setID

var cover_album = document.getElementById("cover_album")
var nome_musica = document.getElementById("nome_musica")
var artista = document.getElementById("artista")

var lista_playlists = document.getElementById("lista_playlists")
var lista_musicas = document.getElementById("lista_musicas")

var slider_musica = document.getElementById("slider_musica")
var slider_volume = document.getElementById("slider_volume")
var duraçao_slider = document.getElementById("duraçao_slider")

var botao_play = document.getElementById("play")
var fundo_random = document.getElementById("div-random") // usar parente na funçao
var fundo_loop = document.getElementById("div-loop")

audio = document.getElementById("audio")
audio.volume = 0.5
slider_volume.value = 50
slider_musica.value = 0

// variaveis
var diretorio = []
var pasta_playlists = ""
var pasta_selecionada = ""
var pasta_tocando = ""
var path_tocando = ""
var playlists = ""

var indice_loaded = 0
var indices_passados = []
var cursor = -1

var aleatorio = 0
var _loop = 0

var cache_dir = {}

// article (musica selecionada), usado para tirar a borda apos mudar a musica
var article
var timer

// eventos
navigator.mediaSession.metadata = new MediaMetadata()
navigator.mediaSession.setActionHandler('play', tocar) // nao usa a funçao adequadamente?
navigator.mediaSession.setActionHandler('pause', tocar)
navigator.mediaSession.setActionHandler('stop', tocar)
navigator.mediaSession.setActionHandler('previoustrack', anterior)
navigator.mediaSession.setActionHandler('nexttrack', proximo)

window.addEventListener('unload', () => ipcRenderer.invoke("salvar_pos", audio.currentTime))
slider_volume.addEventListener("input", volume)
slider_musica.addEventListener("input", seek)
audio.addEventListener("ended", proximo)
audio.addEventListener("loadedmetadata", update_slider)
botao_play.addEventListener("click", tocar)
document.getElementById("ant").addEventListener("click", anterior)
document.getElementById("prox").addEventListener("click", proximo)
document.getElementById("loop").addEventListener("click", loop)
document.getElementById("random").addEventListener("click", random)



carregar_sessao()


async function carregar_sessao() {
   if (getFileStatus() != 0) {
      ({ path_tocando, pasta_tocando, cache_dir } = getPathPassada());
      ({ aleatorio, _loop } = getState());
      ({ indice_loaded, indices_passados, cursor } = getVars());
      pasta_selecionada = pasta_tocando
      pasta_playlists = (path_tocando.split("\\").slice(0, -1)).join("\\")
      listar_playlists(true)
      random(true)
      loop(true)
      volume(true)
   } else {
      setPathPassada(path_tocando, pasta_tocando, cache_dir)
      setState(aleatorio, _loop)
      setVars(indice_loaded, indices_passados, cursor)
      setPos(0.01)
      setVol(audio.volume)
      //setPrefs(false, false)

   }
}

function volume(objeto) {
   if (objeto == true) {
      vol = getVol() * 100
      slider_volume.value = vol
   } else {
      vol = objeto.srcElement.value
   }
   audio.volume = vol / 100
   slider_volume.style.backgroundSize = `${vol}% 100%`

   setVol(audio.volume)
}

function seek(objeto) {
   audio.currentTime = (objeto.srcElement.value / 100) * audio.duration
   update_slider()
}

function update_slider() {
   if (!audio.paused) {
      const { duration, currentTime } = audio
      slider_musica.value = `${(currentTime / duration) * 100}`
      //slider_thumb.left = `${7.5 - ((currentTime / duration) * 15)}px`
      //${(slider_musica.value / 10) - ((7.5 - ((currentTime / duration) * 15))*6.66666)}
      slider_musica.style.backgroundSize = `${(currentTime / duration) * 100}% 100%` // mudar para div
   
      duraçao_slider.innerHTML = `${Math.trunc(currentTime / 60)}:${("0" + Math.trunc(currentTime % 60)).slice(-2)}/${Math.trunc(duration / 60)}:${("0" + Math.trunc(duration % 60)).slice(-2)}`
      console.log("updateslider")
   }
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
   setState(aleatorio, _loop)
}

function random(carregar) {
   if (carregar == true) {
      if (aleatorio == 0) {
         fundo_random.style.backgroundColor = ""
      } else {
         fundo_random.style.backgroundColor = "brown"
      }
   } else {
      if (aleatorio == 0) {
         aleatorio = 1
         fundo_random.style.backgroundColor = "brown"
      } else {
         aleatorio = 0
         fundo_random.style.backgroundColor = ""
      }
      setState(aleatorio, _loop)
   }
}

async function atualizar_tela_musica(indice = indice_loaded) { // pegar direto da tela
   var path_musica = path.join(path_tocando, diretorio_tocando[indice]) // mudar nome?

   try {
      if (article != null) {
         article.setAttribute("class", "")
      }

      article = document.getElementById(`${indice_loaded}`)
      if (article != null && pasta_tocando == pasta_selecionada) {
         article.setAttribute("class", "musica_active")
      }
   } catch (error) {
   }

   jsmediatags.read(path_musica, {
      onSuccess: function (tag) {
         if (tag.tags.title != undefined){
            nome_musica.innerHTML = tag.tags.title
            navigator.mediaSession.metadata.title = tag.tags.title
         } else {
            nome_musica.innerHTML = diretorio_tocando[indice].split(".").slice(0, -1).join(".")
            navigator.mediaSession.metadata.title = nome_musica.innerHTML
         }

         if (tag.tags.artist != undefined) {
            navigator.mediaSession.metadata.artist = tag.tags.artist
            artista.innerHTML = tag.tags.artist
         } else {
            navigator.mediaSession.metadata.artist = ""
            artista.innerHTML = ""
         }

         try {
            const { data, format } = tag.tags.picture;

            let stringB64 = Buffer.from(data, "base64")           // conversao do array do array de dados da imagem e 
            stringB64 = `data:${format};base64,${stringB64.toString('base64')}`
            cover_album.src = stringB64; // converter para string
            navigator.mediaSession.metadata.artwork = [{ src: stringB64 }]
         } catch (error) {
            cover_album.src = 'icons/padrao.png'
            navigator.mediaSession.metadata.artwork = [{ src: 'icons/padrao.png' }] // n funciona
         }
      },
      onError: function (error) {
         cover_album.src = 'icons/padrao.png'
         navigator.mediaSession.metadata.artwork = [{ src: 'icons/padrao.png' }]
         console.log("aqui")
         nome_musica.innerHTML = diretorio_tocando[indice].split(".").slice(0, -1).join(".")

         navigator.mediaSession.metadata.title = nome_musica.innerHTML

         artista.innerHTML = ""
         navigator.mediaSession.metadata.artist = ""
         console.log("error: " + error.type, error.info)
      }
   })
}

async function selecionar_pasta(retomar) {
   if (!retomar) {
      return await ipcRenderer.invoke("browse_pasta") // dialog so pode ser usado no main
   } else {
      return [pasta_playlists]
   }
}

function listar_playlists(retomar = false) {
   selecionar_pasta(retomar).then((pasta) => {
      if (pasta != undefined) {
         lista_playlists.innerHTML = ""
         pasta_playlists = pasta[0]

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
         if (!retomar) {
            setPathPassada(path_tocando, pasta_tocando, cache_dir)
         } else {
            selecionar_playlist(undefined, true)
         }
      }
   }
   )
}

function selecionar_playlist(botao, retomar = false) {
   let diferente = false

   if (retomar) {
      botao = Array.from(document.getElementsByClassName("playlist")).find(playlist => {
         return playlist.innerHTML == pasta_tocando
      })
      diferente = true
   } else {
      if (botao.firstChild.innerHTML != pasta_selecionada) { diferente = true; pasta_selecionada = botao.firstChild.innerHTML }
   }

   if (diferente) {
      lista_musicas.innerHTML = ""
      document.getElementById("cabeçalho_musicas").hidden = false

      Array.from(lista_playlists.childNodes).forEach(li => {
         if (li != botao) {
            li.setAttribute("class", "disabled")
            if (li.firstChild.className == "playlist texto_active") {
               li.firstChild.setAttribute("class", "playlist")
            }
         }
      })

      let caminho = path.join(pasta_playlists, pasta_selecionada)
      let mudou = false

      diretorio = fs.readdirSync(caminho, { withFileTypes: true })
         .filter(arquivo => arquivo.isFile() && [".MP3", ".M4A", ".AAC", ".FLAC", ".OGG", ".OGA", ".DOLBY", ".WAV", ".CAF", ".OPUS", ".WEBA"].includes(path.extname(arquivo.name).toUpperCase()))

      try {
         mudou = diretorio.length != cache_dir[`${pasta_selecionada}`].length
      } catch (error) {
      }

      if (pasta_selecionada in cache_dir && mudou == false) {              // botao reload
         console.log("pega dir")
         diretorio = cache_dir[`${pasta_selecionada}`]
      } else {
         console.log("novo diretorio")
         diretorio = diretorio.map(arquivo => arquivo.name).sort(function (a, b) {
            if (fs.statSync(caminho + "/" + a).birthtime < fs.statSync(caminho + "/" + b).birthtime) {
               return 1
            } else {
               return -1
            }
         })           // em ordem de criação, mais novo > mais velho

         cache_dir[`${pasta_selecionada}`] = diretorio
      }

      if (retomar) {
         const funçaoT = async () => {
            botao.setAttribute("class", "playlist texto_active")
            
            diretorio_tocando = diretorio
            carregar_musica()

            audio.currentTime = getPos()
            let v = audio.volume
            audio.volume = 0
            await tocar() // conserta o bug dos listeners de botao nao respondendo (linha 50) antes de se dar play no minimo 1 vez
            tocar()
            audio.volume = v
         }
         funçaoT()
      } else {
         botao.firstChild.setAttribute("class", "playlist texto_active")
      }

      let tempoTotal = 0
      let tempo1 = performance.now()

      async function listar_musicas(diretorio) {            //! melhorar desempenho
         let frag = document.createDocumentFragment()

         for (let [i, elemento] of diretorio.entries()) {
            console.log(i)
            // tirar listener daqui, colocar dbclick global e checar elemento clicado
            let linha = document.createElement("article")
            linha.addEventListener("dblclick", tocar_especifica_clique)
            linha.setAttribute("id", i)

            let img = document.createElement("img")
            img.setAttribute("class", "img")

            let nome_musica = document.createElement("p")
            nome_musica.setAttribute("class", "nome_musicas texto_padrao")

            let ext = document.createElement("p")
            ext.setAttribute("class", "extensao texto_padrao")
            ext.innerHTML = `.${elemento.split(".").pop().toUpperCase()}`

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
                     
                     nome_musica.innerHTML = tag.tags.title != undefined ? tag.tags.title : diretorio[i].split(".").slice(0, -1).join(".")
                     artista.innerHTML = tag.tags.artist != undefined ? tag.tags.artist : ""
                     album.innerHTML = tag.tags.album != undefined ? tag.tags.album : ""

                     nome_musica.appendChild(artista)
                     linha.appendChild(img)
                     linha.appendChild(nome_musica)
                     linha.appendChild(album)
                     linha.appendChild(ext)

                     frag.appendChild(linha)
                     tempoTotal += (performance.now() - tempo)
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
                     tempoTotal += (performance.now() - tempo)
                     resolve()
                  }
               })
               let tempo = performance.now()
               if (i % 12 == 0) {
                  lista_musicas.appendChild(frag)        // bottleneck no render
                  frag = document.createDocumentFragment()
               }
               tempoTotal += (performance.now() - tempo)
            })
         }

         lista_musicas.appendChild(frag)        // append do resto caso sobre (0 < (diretorio.length % 15) < 15)

         console.log(tempoTotal)             // tempo do if #462

         console.log(performance.now() - tempo1)               // tempo total da função

         Array.from(lista_playlists.childNodes).forEach(li => {        // habilitar botoes de volta
            if (li != botao) { li.setAttribute('class', '') }
         })

         if (retomar || pasta_tocando == pasta_selecionada) {
            diretorio_tocando = diretorio
            article = document.getElementById(`${indice_loaded}`)
            if (article != null) {
               article.setAttribute("class", "musica_active")
            }
         }

         setPathPassada(path_tocando, pasta_tocando, cache_dir)     // salva cache
      }

      listar_musicas(diretorio)

   }
}

function carregar_musica(indice = indice_loaded) {
   clearInterval(timer)

   if (diretorio_tocando[indice] == undefined) {
      indice = 0
      indice_loaded = 0
   }
   audio.src = path.join(path_tocando, diretorio_tocando[indice])

   timer = setInterval(update_slider, 1000)
   atualizar_tela_musica(indice)
   setVars(indice_loaded, indices_passados, cursor)
}

function tocar_especifica() {
   carregar_musica(indice_loaded)

   botao_play.src = "icons/pause.svg"
   audio.play()
}

function tocar_especifica_clique(objeto) {
   indices_passados = []
   cursor = 0
   
   if (article != undefined) {
      article.setAttribute("class", "")
   }
   article = objeto.target.closest("article")
   article.class = "musica_active"
   indice_loaded = Number(article.id)
   
   if (pasta_selecionada != pasta_tocando) {
      path_tocando = path.join(pasta_playlists, pasta_selecionada)
      pasta_tocando = pasta_selecionada
   }

   diretorio_tocando = diretorio    // transformar em objeto / pointer

   indices_passados.push(indice_loaded)

   setPathPassada(path_tocando, pasta_tocando, cache_dir)
   carregar_musica(indice_loaded)
   botao_play.src = "icons/pause.svg"

   audio.play()
}

async function tocar() {    // botao play
   if (diretorio_tocando.length) {
      let botao_src = botao_play.src.split("/").slice(-1)[0]
      if (botao_src == "play.svg") {
         botao_play.src = "icons/pause.svg"

         if (audio.src != "") {
            await audio.play()
         } else {
            if (aleatorio == 0) {
               tocar_especifica()

            } else {
               indice_loaded = Math.floor(Math.random() * diretorio_tocando.length)
               while (indices_passados.includes(indice_loaded)) {indice_loaded = Math.floor(Math.random() * diretorio.length)}
               indices_passados.push(indice_loaded)
               tocar_especifica()
            }
         }
      } else {
         botao_play.src = "icons/play.svg"
         await audio.pause()
      }
   }
}

function anterior() {                // botao anterior
   if (diretorio_tocando.length) {
      if (audio.src == "") {
         tocar()
      } else {

         botao_play.src = "icons/pause.svg"

         if (aleatorio == 0) {
            if (indice_loaded != 0) {
               indice_loaded -= 1
            } else {
               indice_loaded = diretorio_tocando.length - 1
            }
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
               if (indices_passados.length == diretorio_tocando.length) {
                  cursor = 0
                  indices_passados = []
               }      
               indice_loaded = Math.floor(Math.random() * diretorio_tocando.length)
               while (indices_passados.includes(indice_loaded)) {indice_loaded = Math.floor(Math.random() * diretorio.length)}
               indices_passados.unshift(indice_loaded)
            }
            tocar_especifica()
         }

      }
   }
}

function proximo() {                             // botao proximo
   if (diretorio_tocando.length) {
      if (audio.src != "") {
         botao_play.src = "icons/pause.svg"

         if (aleatorio == 0) {                                 //nao-aleatorio
            if (indice_loaded == diretorio_tocando.length - 1) {
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
            } else {
               if (indices_passados.length == diretorio_tocando.length) {
                  cursor = -1
                  indices_passados = []
               }      
               cursor += 1
               indice_loaded = Math.floor(Math.random() * diretorio_tocando.length)
               while (indices_passados.includes(indice_loaded)){indice_loaded = Math.floor(Math.random() * diretorio_tocando.length)}
               indices_passados.push(indice_loaded)
            }
            console.log(indice_loaded)
            tocar_especifica()

         }
      } else {
         tocar_especifica()
         
      }
   }
}

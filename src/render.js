const fs = require('fs');
const jsmediatags = require('jsmediatags');
const { ipcRenderer } = require('electron');
const path = require('path');


nome_musica = document.getElementById("nome_musica")
artista = document.getElementById("artista")
cover_album = document.getElementById("cover_album")
lista_playlists = document.getElementById("lista_playlists")
lista_musicas = document.getElementById("lista_musicas")
audio = document.getElementById("audio")
audio.addEventListener("timeupdate", update_slider)
audio.addEventListener("ended", proximo)
div_slider = document.getElementById("div-slider")
slider = document.getElementById("slider_musica")
slider.addEventListener("change", seek)


botao_play = document.getElementById("play")
fundo_random = document.getElementById("div-random")
fundo_loop = document.getElementById("div-loop")

diretorio = []
pasta_playlists = ""
pasta_selecionada = ""
playlists = ""

indice_loaded = 0
indices_passados = []
cursor = 0

aleatorio = 0
_loop = 0

function seek(objeto) {
  console.log(objeto.srcElement.value)
  audio.currentTime = (objeto.srcElement.value/100)*audio.duration

}
function update_slider(objeto) {
  const {duration, currentTime} = objeto.srcElement
  slider.value = `${(currentTime / duration) * 100}`
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

function atualizar_tela_musica(indice = indice_loaded) {
  var path_diretorio = path.join(pasta_playlists, pasta_selecionada, diretorio[indice])
  jsmediatags.read(path_diretorio, {
    onSuccess: function (tag) {
      nome_musica.innerHTML = tag.tags.title
      artista.innerHTML = tag.tags.artist
      try {
        const { data, format } = tag.tags.picture;
        let stringB64 = Buffer.from(data)           // conversao do array do array de dados da imagem e 
        cover_album.src = `data:${format};base64,${stringB64.toString('base64')}`; // converter para string
      } catch (error) {
        cover_album.src = 'icons/padrao.png'
      }

    },
    onError: function (error) {
      // escopo diretorio n funciona aqui
      nome_musica.innerHTML = path_diretorio.split("\\").slice(-1)[0].split(".").slice(0, -1).join(".") //!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
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
      pasta_playlists = pasta[0] //erro
      console.log(pasta_playlists)
      playlists = fs.readdirSync(pasta_playlists) // botar para ler apenas diretorios

      for (let i in playlists) {
        let item = document.createElement("li")
        item.setAttribute("class", "playlist")
        item.setAttribute("onclick", "selecionar_playlist(this)")
        item.innerHTML = playlists[i]

        lista_playlists.appendChild(item)
      }
    }
  }
  )
}

function selecionar_playlist(botao) {
  cancelado = true
  console.log(botao)       //desativar outros quando um é clicado, se clicar novamente continuar ativado 
  if (botao.className != 'list-group-item bg-black text-white active') {
    botao.setAttribute('class', 'list-group-item bg-black text-white active')
  } else {
    botao.setAttribute('class', 'list-group-item bg-black text-white')
  }

  pasta_selecionada = botao.innerHTML

  let dire = fs.readdirSync(path.join(pasta_playlists, pasta_selecionada), { withFileTypes: true }) //apenas musicas
  console.log(path.extname(dire[0].name).toUpperCase())
  diretorio = dire
    .filter(arquivo => arquivo.isFile() && [".MP3", ".AAC", ".FLAC", ".OGG", ".OGA", ".DOLBY", ".WAV", ".CAF", ".OPUS", ".WEBA"].includes(path.extname(arquivo.name).toUpperCase()))
    .map(arquivo => path.join(arquivo.name))

  lista_musicas.innerHTML = ""

  let caminho = path.join(pasta_playlists, pasta_selecionada)

  async function a(diretorio) {
    cancelado = false
    for (let i in diretorio) {
      console.log(i)
      await new Promise((resolve, reject) => jsmediatags.read(path.join(caminho, diretorio[i]), {   // nao usar listas, colocar article? div? flex
        onSuccess: function (tag) {                                 // imagem - nome/artista - etc como sections?
          let linha = document.createElement("article")                        //nao esta organizado direto
          linha.setAttribute("class", "musica")
          linha.setAttribute("id", i)
          linha.addEventListener("dblclick", tocar_especifica_clique)
          //linha.setAttribute("ondblclick", "tocar_especifica(id)")

          let img = document.createElement("img")
          img.setAttribute("class", "img")

          try {
            const { data, format } = tag.tags.picture;
            let stringB64 = Buffer.from(data)           // conversao do array do array de dados da imagem e 
            img.src = `data:${format};base64,${stringB64.toString('base64')}`; // converter para string
          } catch (error) {
            img.src = 'icons/padrao.png'
          }

          linha.appendChild(img)

          let nome_musica = document.createElement("p")
          nome_musica.setAttribute("class", "nome_musicas")
          nome_musica.innerHTML = tag.tags.title

          let artista = document.createElement("p")
          artista.setAttribute("class", "artista")
          artista.innerHTML = tag.tags.artist
          nome_musica.appendChild(artista)
          linha.appendChild(nome_musica)

          lista_musicas.appendChild(linha)

          resolve()
        },
        onError: function (error, tag) {
          let linha = document.createElement("article")                        //nao esta organizado direto
          linha.setAttribute("class", "musica")
          linha.setAttribute("id", i)
          linha.addEventListener("dblclick", tocar_especifica_clique)

          let img = document.createElement("img")
          img.setAttribute("class", "img")

          img.src = 'icons/padrao.png'

          linha.appendChild(img)

          // escopo diretorio n funciona aqui
          let nome_musica = document.createElement("p")
          nome_musica.setAttribute("class", "nome_musicas")
          nome_musica.innerHTML = diretorio[i].split(".").slice(0, -1).join(".")//path_diretorio.split("\\").slice(-1)[0].split(".").slice(0, -1).join(".") //!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

          linha.appendChild(nome_musica)
          lista_musicas.appendChild(linha)

          console.log("error: " + error.type, error.info)
          resolve()
        }
      }))
    }
  }
  a(diretorio)
}

async function background() {

}

function carregar_sessao() {

}

function carregar_musica(indice = indice_loaded) {
  audio.src = path.join(pasta_playlists, pasta_selecionada, diretorio[indice])
  // audio = new howler.Howl({
  //   src: [path.join(pasta_playlists, pasta_selecionada, diretorio[indice])],
  //   html5: true,
  // })
  atualizar_tela_musica(indice)
}

function tocar_especifica(indice = indice_loaded) {
  console.log(indice)
  console.log(typeof(indice))

  carregar_musica(indice)

  botao_play.src = "icons/pause.svg"
  audio.play()
}

function tocar_especifica_clique(objeto) {
  indices_passados = []
  cursor = 0

  indice_loaded = Number(objeto.target.closest("article").id)

  carregar_musica(indice_loaded)

  botao_play.src = "icons/pause.svg"

  audio.play()
  console.log("funcionou")
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

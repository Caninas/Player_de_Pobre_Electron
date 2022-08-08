const howler = require('howler');
const fs = require('fs');
const jsmediatags = require('jsmediatags');
const { ipcRenderer } = require('electron');
const path = require('path');


nome_musica = document.getElementById("nome_musica")
artista = document.getElementById("artista")
cover_album = document.getElementById("cover_album")
lista_playlists = document.getElementById("lista_playlists")
lista_musicas = document.getElementById("lista_musicas")

//var musica = new Musica("C:/Users/rasen/Desktop/musicas/Tranquilão/Baby Blue - Remastered 2010.mp3")
//musica.tocar()

class Player {
  constructor() {
    this.botao_play = document.getElementById("play")
    this.fundo_random = document.getElementById("div-random")
    this.fundo_loop = document.getElementById("div-loop")

    this.diretorio = []

    this.pasta_playlists = ""
    this.pasta_selecionada = ""
    this.playlists = ""

    this.musica = ""
    this.indice_loaded = 0
    this.indices_passados = []
    this.cursor = 0

    this.aleatorio = 0
    this._loop = 0

  }

  loop() {
    if (this.musica != "") {
      if (this._loop == 0) {
        this._loop = 1
        this.musica.loop(true)
        this.fundo_loop.style.backgroundColor = "brown"
      } else {
        this._loop = 0
        this.musica.loop(false)
        this.fundo_loop.style.backgroundColor = ""
      }
    }
  }

  random() {
    if (this.aleatorio == 0) {
      this.aleatorio = 1
      this.fundo_random.style.backgroundColor = "brown"
    } else {
      this.aleatorio = 0
      this.fundo_random.style.backgroundColor = ""
    }
  }

  atualizar_tela_musica(indice = this.indice_loaded) {
    var diretorio = path.join(this.pasta_playlists, this.pasta_selecionada, this.diretorio[indice])
    jsmediatags.read(diretorio, {
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
        // escopo this.diretorio n funciona aqui
        nome_musica.innerHTML = diretorio.split("\\").slice(-1)[0].split(".").slice(0, -1).join(".") //!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
        console.log("error: " + error.type, error.info)
      }
    })
  }

  async selecionar_pasta() {
    return await ipcRenderer.invoke("browse_pasta") // dialog so pode ser usado no main
  }

  listar_playlists() {
    this.selecionar_pasta().then(pasta_playlists => {
      if (pasta_playlists != undefined) {
        lista_playlists.innerHTML = ""
        this.pasta_playlists = pasta_playlists[0] //erro
        this.playlists = fs.readdirSync(this.pasta_playlists) // botar para ler apenas diretorios

        for (let i in this.playlists) {
          let item = document.createElement("li")
          item.setAttribute("class", "playlist")
          item.setAttribute("onclick", "player.selecionar_playlist(this)")
          item.innerHTML = this.playlists[i]

          lista_playlists.appendChild(item)
        }
      }
    }
    )
  }

  selecionar_playlist(botao) {
    console.log(botao)       //desativar outros quando um é clicado, se clicar novamente continuar ativado 
    if (botao.className != 'list-group-item bg-black text-white active') {
      botao.setAttribute('class', 'list-group-item bg-black text-white active')
    } else {
      botao.setAttribute('class', 'list-group-item bg-black text-white')
    }

    this.pasta_selecionada = botao.innerHTML

    let dire = fs.readdirSync(path.join(this.pasta_playlists, this.pasta_selecionada), { withFileTypes: true }) //apenas musicas
    console.log(path.extname(dire[0].name).toUpperCase())
    this.diretorio = dire
      .filter(arquivo => arquivo.isFile() && [".MP3", ".AAC", ".FLAC", ".OGG", ".OGA", ".DOLBY", ".WAV", ".CAF", ".OPUS", ".WEBA"].includes(path.extname(arquivo.name).toUpperCase()))
      .map(arquivo => path.join(arquivo.name))

    lista_musicas.innerHTML = ""

    var diretorio = path.join(this.pasta_playlists, this.pasta_selecionada)

    let promises = this.diretorio.map((nome, index) => tags(diretorio, this.diretorio, index))

    function tags(path_diretorio, diretorio, i) {
      console.log(i)
      return new Promise((resolve, reject) => {
        jsmediatags.read(path.join(path_diretorio, diretorio[i]), {   // nao usar listas, colocar article? div? flex
          onSuccess: function (tag) {                                 // imagem - nome/artista - etc como sections?
            let linha = document.createElement("article")                        //nao esta organizado direto
            linha.setAttribute("class", "musica")
            linha.setAttribute("id", i)
            linha.addEventListener("dblclick", player.tocar_especifica)
            //linha.setAttribute("ondblclick", "player.tocar_especifica(this.id)")

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
          onError: function (error) {
            // escopo this.diretorio n funciona aqui
            nome_musica.innerHTML = path_diretorio.split("\\").slice(-1)[0].split(".").slice(0, -1).join(".") //!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
            console.log("error: " + error.type, error.info)
            reject(error)
          }
        })
      })
    }

  }


  carregar_sessao() {

  }

  carregar_musica(indice = this.indice_loaded) {
    this.musica = new howler.Howl({
      src: [path.join(this.pasta_playlists, this.pasta_selecionada, this.diretorio[indice])],
      html5: true,
    })
    this.atualizar_tela_musica(indice)
  }

  tocar_especifica(indice = this.indice_loaded) {
    this.id
    console.log(indice)
    if (this.musica != "") {
      this.musica.unload()
    }
    this.carregar_musica(indice)

    this.botao_play.src = "icons/pause.svg"

    this.musica.play()
  }

  tocar() {    // botao play
    if (this.diretorio.length != 0) {
      let botao_src = this.botao_play.src.split("/").slice(-1)[0]

      if (botao_src == "play.svg") {
        this.botao_play.src = "icons/pause.svg"

        if (this.musica != "") {
          this.musica.play()
        } else {
          if (this.aleatorio == 0) {
            this.tocar_especifica()

          } else {
            this.indice_loaded = Math.floor(Math.random() * this.diretorio.length)
            this.indices_passados.push(this.indice_loaded)
            this.tocar_especifica()
          }

        }
      } else {
        this.botao_play.src = "icons/play.svg"
        this.musica.pause()
      }
    }
  }

  anterior() {                // botao anterior
    if (this.diretorio != 0) {
      if (this.musica == "") {
        this.tocar()
      } else {
        if (!this.musica.playing()) {
          this.botao_play.src = "icons/pause.svg"
        }

        if (this.aleatorio == 0) {
          this.indice_loaded -= 1
          this.tocar_especifica()
          if (this.indices_passados != []) {
            this.cursor = 0
            this.indices_passados = [this.indice_loaded]
          }

        } else {
          if (this.cursor != 0) {
            this.cursor -= 1
            this.indice_loaded = this.indices_passados[this.cursor]
          } else {
            this.indice_loaded = Math.floor(Math.random() * this.diretorio.length)
            this.indices_passados.unshift(this.indice_loaded)
          }
          this.tocar_especifica()
        }

      }
    }
  }

  proximo() {                             // botao proximo
    if (this.diretorio != 0) {
      if (this.musica == "") {
        this.tocar_especifica()
      } else {
        if (!this.musica.playing()) {
          this.botao_play.src = "icons/pause.svg"
        }

        if (this.aleatorio == 0) {                                 //nao-aleatorio
          if (this.indice_loaded == this.diretorio.length - 1) {
            this.indice_loaded = 0
          } else {
            this.indice_loaded += 1
          }
          if (this.indices_passados != []) {
            this.cursor = 0
            this.indices_passados = [this.indice_loaded]
          }

          this.tocar_especifica()

        } else {                                                  //aleatorio
          if (this.indices_passados.length > 1 && this.cursor != this.indices_passados.length - 1) {
            this.cursor += 1
            this.indice_loaded = this.indices_passados[this.cursor]
          } else if (this.indices_passados.length == 0) {
            this.indice_loaded = Math.floor(Math.random() * this.diretorio.length)
            this.indices_passados.push(this.indice_loaded)

          } else {
            this.cursor += 1
            this.indice_loaded = Math.floor(Math.random() * this.diretorio.length)
            this.indices_passados.push(this.indice_loaded)
          }
          console.log(this.indice_loaded)
          this.tocar_especifica()

        }
      }
    }
  }
}

const player = new Player()
player.loop
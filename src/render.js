const howler = require('howler');
const fs = require('fs');
const { randomInt } = require('crypto');
const jsmediatags = require('jsmediatags');
const { ipcRenderer } = require('electron');



nome_musica = document.getElementById("nome_musica")
artista = document.getElementById("artista")
cover_album = document.getElementById("cover_album")
lista_playlists = document.getElementById("lista_playlists")
lista_musicas = document.getElementById("lista_musicas")


class Musica {
  constructor(caminho) {
    this.caminho = caminho
    this.musica = new howler.Howl({
      src: [this.caminho],
      html5: true,
      preload: true,
      onload: function () {
        var duraçao = this.duration
      },
    })  //requestAnimationFrame atualizar slider

    jsmediatags.read(this.caminho, {
      onSuccess: function (tag) {
        this.nome = tag.tags.title
        this.artista = tag.tags.artist
        this.album = tag.tags.album

        const { data, format } = tag.tags.picture;
        let stringB64 = Buffer.from(data)           // conversao do array do array de dados da imagem e 
        this.cover = `data:${format};base64,${stringB64.toString('base64')}`; // converter para string
      },

      onError: function (error) {
        console.log("error: " + error.type, error.info) //return error, passar para proxima?
      }
    })
  }

  setar_duraçao() {
    console.log(this.duraçao)
  }

  tocar() {
    this.id = this.musica.play()
  }

  unload() {
    this.musica.unload()
  }
}

//var musica = new Musica("C:/Users/rasen/Desktop/musicas/Tranquilão/Baby Blue - Remastered 2010.mp3")
//musica.tocar()

class Player {
  constructor() {
    this.botao_play = document.getElementById("play")

    this.diretorio = fs.readdirSync("C:/Users/rasen/Desktop/musicas/Tranquilão")
    this.diretorio.forEach((path, index) => { this.diretorio[index] = "C:/Users/rasen/Desktop/musicas/Tranquilão/" + path })

    this.pasta_playlists = ""
    this.playlists = ""

    this.musica = ""
    this.indice_loaded = 0

    this.aleatorio = 0
    this._loop = 0

  }

  async selecionar_pasta() {
    return await ipcRenderer.invoke("browse_pasta") // dialog so pode ser usado no main
  }

  loop(botao) {
    if (this.musica != ""){
      if (this._loop == 0){
        this._loop = 1
        this.musica.loop(true)
        //botao.style.
      } else {
        this._loop = 0
        this.musica.loop(false)
      }
    }
    
  }

  random(botao) {
    console.log("adsdasdasdsa")
  }

  atualizar_tela_musica() {
    jsmediatags.read(this.diretorio[this.indice_loaded], {
      onSuccess: function (tag) {
        nome_musica.innerHTML = tag.tags.title
        artista.innerHTML = tag.tags.artist

        const { data, format } = tag.tags.picture;
        let stringB64 = Buffer.from(data)           // conversao do array do array de dados da imagem e 
        cover_album.src = `data:${format};base64,${stringB64.toString('base64')}`; // converter para string
      },
      onError: function (error) {
        console.log("error: " + error.type, error.info)
      }
    })
  }

  carregar_musica() {
    this.musica = new howler.Howl({
      src: [this.diretorio[this.indice_loaded]],
      html5: true,
    })
    this.atualizar_tela_musica()
  }

  carregar_sessao() {

  }

  listar_playlists() {
    this.selecionar_pasta().then(pasta_playlists => {
      this.pasta_playlists = pasta_playlists[0]
      this.playlists = fs.readdirSync(this.pasta_playlists)

      for (let i in this.playlists) {
        let item = document.createElement("li")
        item.setAttribute("class", "list-group-item bg-black text-white")
        item.setAttribute("onclick", "selecionar_playlist(this)")
        item.innerHTML = this.playlists[i]
        lista_playlists.appendChild(item)
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
  }

  tocar(botao=this.botao_play) {
    let botao_src = botao.src.split("/").slice(-1)[0]

    if (botao_src == "play.svg") {
      botao.src = "icons/pause.svg"

      if (this.musica != "") {
        this.musica.play()
      } else {
          if (this.aleatorio == 0) {
            this.carregar_musica()

          } else {
            this.indice_loaded = randomInt(this.diretorio.length)
            this.carregar_musica()
          }
          this.musica.play()
        }
    } else {
      botao.src = "icons/play.svg"
      this.musica.pause()
    }
  }

  anterior() {
    try {
      this.selecionar_pasta().then(pasta => this.listar_playlists(pasta[0]))
    } catch (error) {
      
    }

  }

  proximo() {
    console.log("inicio proximo")
    if (this.musica == "") {
      this.tocar()
    } else {
      if (!this.musica.playing()){
        this.botao_play.src = "icons/pause.svg"
      }
      
      this.musica.unload()

      if (this.aleatorio == 0){                                 //nao-aleatorio
        if (this.indice_loaded == this.diretorio.length - 1){
          this.indice_loaded = 0
        } else {
          this.indice_loaded += 1
        }

        this.carregar_musica()

      } else {                                                //aleatorio
        this.indice_loaded = randomInt(this.diretorio.length)
        this.carregar_musica()
      }

      this.musica.on('load', function(){console.log("carregou")})
      this.musica.play()
      console.log("play")
    }
  }
}

const player = new Player()
player.loop
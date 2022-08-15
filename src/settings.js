const Store = require('electron-store');
const storage = new Store();


function getTamanhotela() {
    const fullscreen = storage.get("fullscreen")
    const tamanho = storage.get("tamanho_tela")

    if (tamanho && fullscreen) {
        return {fullscreen, tamanho}
    } else {
        const fullscreen = storage.set("fullscreen", true)
        const tamanho = storage.set("tamanho_tela", [1600, 900])
        return {fullscreen, tamanho}
    }
}

function setTamanhotela(fullscreen, tamanho) {
    console.log(fullscreen, tamanho)
    storage.set("fullscreen", fullscreen)
    storage.set("tamanho_tela", tamanho)
}

function getSessaoPassada(){
    const sessao = storage.get("sessao")

    if (sessao) {
        return sessao
    } else {
        return 0
    }
}

function setSessaoPassada(pasta_p, pasta_s, indice, indices_p, cursor, random, cache){
    storage.set("sessao", {
        "pasta_playlists": pasta_p,
        "pasta_selecionada": pasta_s,
        "indice_loaded": indice,
        "indices_passados": indices_p,
        "cursor": cursor,
        "aleatorio": random,
        "cache": cache,
    })


}


module.exports = {
    getTamanhotela: getTamanhotela,
    setTamanhotela: setTamanhotela,
    getSessaoPassada: getSessaoPassada,
    setSessaoPassada: setSessaoPassada,

}
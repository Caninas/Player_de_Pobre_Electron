const Store = require('electron-store');
const storage = new Store();

function getFileStatus() {
    const status = [getVars(), getPos(), getState(), getPathPassada(), getTamanhotela(), getVol()]//getPrefs()
    if (status.includes(false)) {
        return 0
    } else {
        return 1
    }
}

function getTamanhotela() {
    const fullscreen = storage.get("fullscreen")
    const tamanho = storage.get("tamanho_tela")
    if (fullscreen != undefined && tamanho != undefined ) {
        return { fullscreen, tamanho }
    } else {
        let padrao = [1600, 900]
        storage.set("fullscreen", true)
        storage.set("tamanho_tela", padrao)
        return { "fullscreen": true, "tamanho": padrao }
    }
}

function setTamanhotela(fullscreen, tamanho) {
    storage.set("fullscreen", fullscreen)
    storage.set("tamanho_tela", tamanho)
}

function getPathPassada() {
    const paths = storage.get("paths")

    if (paths) {
        return paths
    } else {
        return false
    }
}

function setPathPassada(path_t, pasta_t, cache_dir) {
    storage.set("paths", {
        "path_tocando": path_t,
        "pasta_tocando": pasta_t,
        "cache_dir": cache_dir,
    })
}

function setVars(indice, indices_p, cursor) {
    storage.set("vars", {
        "indice_loaded": indice,
        "indices_passados": indices_p,
        "cursor": cursor,
    })
}

function getVars() {
    const vars = storage.get("vars")

    if (vars) {
        return vars
    } else {
        return false
    }
}

function setState(random, loop) {
    storage.set("state", {
        "aleatorio": random,
        "_loop": loop,
    })
}

function getState() {
    const state = storage.get("state")

    if (state) {
        return state
    } else {
        return false
    }
}

function setPos(pos_mus) {
    storage.set("pos_musica", pos_mus)
}

function getPos() {
    const pos = storage.get("pos_musica")

    if (pos) {
        return pos
    } else {
        return false
    }
}

function setVol(vol) {
    storage.set("volume", vol)
}

function getVol() {
    const vol = storage.get("volume")

    if (vol) {
        return vol
    } else {
        return false
    }
}

// function setPrefs(gravarCache, hideFolder) {
//     storage.set("preferencias", {
//         "gravarCache": gravarCache,
//         "hideFolder": hideFolder,
//     })
// }

// function getPrefs() {
//     const preferencias = storage.get("preferencias")
//     if (preferencias) {
//         const { gravarCache, hideFolder } = preferencias
//         return [gravarCache, hideFolder]
//     } else {
//         return false
//     }
// }

// function getID() {
//     const id = storage.get("id")

//     if (id) {
//         return id
//     } else {
//         return false
//     }
// }

// function setID(id) {
//     storage.set("id", id)
// }



module.exports = {
    getTamanhotela: getTamanhotela,
    setTamanhotela: setTamanhotela,
    getFileStatus: getFileStatus,
    getPathPassada: getPathPassada,
    setPathPassada: setPathPassada,
    setVars: setVars,
    getVars: getVars,
    setState: setState,
    getState: getState,
    setPos: setPos,
    getPos: getPos,
    setVol: setVol,
    getVol: getVol,
    // setID: setID,
    // getID: getID,
    // setPrefs: setPrefs,
    // getPrefs: getPrefs,
}
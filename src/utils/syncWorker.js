/* eslint-disable */ 
import { isEqual } from "lodash/core";
const axios = require("axios");

async function callAPI(data) {
  let result = null;
  let options = {
    url: data.url,
    headers: {
      "Content-Type": "application/json",
      "x-access-token": data.jwt
    },
    method: data.method
  };
  if (data.data) {
    options["data"] = data.data;
  }
  await axios(options)
    .then(response => {
      result = response.data;
      console.log(result);
    })
    .catch(function(err) {
      postMessage({
        mutation: "toggleSyncing",
        payload: false
      });
      postMessage({
        mutation: "toggleSyncFailed",
        payload: true
      });
      console.log(err);
    });
  return result;
}

async function cloudSync(data) {
  let decks = data.decks;
  let userCollection = data.userCollection;
  let lastSyncsData = data.lastSyncsData;
  console.log("    sync called");
  if (!data.skipSameCheck) {
    if (
      isEqual(lastSyncsData.userCollection, userCollection) &&
      isEqual(lastSyncsData.decks, decks)
    ) {
      console.log("equality with last syncs data");
      return null;
    }
  }
  postMessage({
    mutation: "toggleSyncing",
    payload: true
  });
  if (data.syncing || userCollection.user_id === "Tutorial") {
    console.log("    syncing blocked");
    postMessage({
      mutation: "toggleSyncing",
      payload: false
    });
    return null;
  }
  if (!data.online || lastSyncsData === null) {
    console.log("!online, lastSyncData == null");
    postMessage({
      mutation: "toggleSyncFailed",
      payload: true
    });
    postMessage({
      mutation: "toggleSyncing",
      payload: false
    });
    // toggle sync to show we tried, this makes sure initial sync will always be incremented at startup
    return null;
  }

  postMessage({
    mutation: "toggleSyncFailed",
    payload: false
  });
  console.log("    starting sync");
  let serverCollection;
  let localDecksMeta = data.decksMeta;
  let serverDecksMeta = null;
  let getMetaDataCall = {
    url: data.serverURL + "/get_meta_and_collection",
    jwt: data.jwt,
    method: "GET"
  };
  let metaDataCallResults = null;
  await callAPI(getMetaDataCall).then(data => {
    metaDataCallResults = data;
  });
  console.log("    Get Meta and Collection ", metaDataCallResults);
  if (metaDataCallResults === null) {
    return null;
  }
  serverCollection = metaDataCallResults["user_collection"];
  serverDecksMeta = metaDataCallResults["decks_meta"];
  // user collections comparisons
  if (!isEqual(serverCollection, userCollection)) {
    for (let server_deleted_deck_id of serverCollection.deleted_deck_ids) {
      // if server deleted, but local deleted isn't, delete locally
      if (!userCollection.deleted_deck_ids.includes(server_deleted_deck_id)) {
        // add to local usercollection deleted list
        userCollection.deleted_deck_ids.push(server_deleted_deck_id);
        // remove from usercollection included list
        let deck_idIndex = userCollection.deck_ids.indexOf(
          server_deleted_deck_id
        );
        // if its actually in local
        if (deck_idIndex !== -1) {
          userCollection.deck_ids.splice(deck_idIndex, 1);
          // remove the deck from 'decks'  // note this is only for 'lastsyncsdata' purposes.
          let deckToDeleteLst = decks.filter(function(deckToCheck) {
            return deckToCheck.deck_id === server_deleted_deck_id;
          });
          let deckToDelete = deckToDeleteLst[0];
          let deckIndex = decks.indexOf(deckToDelete);
          if (deckIndex !== -1) {
            //just in case its not there alraady
            decks.splice(deckIndex, 1);
          }
          postMessage({
            mutation: "deleteDeck",
            payload: server_deleted_deck_id
          });
        }
      }
    }
    // if local deleted, but server deleted isn't, add to server deleted list
    let decksToDeleteOnServer = [];
    for (let client_deleted_deck_id of userCollection.deleted_deck_ids) {
      if (!serverCollection.deleted_deck_ids.includes(client_deleted_deck_id)) {
        decksToDeleteOnServer.push(client_deleted_deck_id);
      }
    } // call delete decks (server will update it's deleted decks list on its end)
    if (decksToDeleteOnServer.length > 0) {
      let deleteCallData = {
        url: data.serverURL + "/delete_decks",
        jwt: data.jwt,
        method: "DELETE",
        data: {
          deck_ids: decksToDeleteOnServer
        }
      };
      let deleteDecksCallResults = null;
      await callAPI(deleteCallData).then(data => {
        deleteDecksCallResults = data;
      });
      console.log("    decks deleted: ", deleteDecksCallResults)
      if (deleteDecksCallResults === null) {
        return null;
      }
    }
    // if there are new decks from server, add their IDs, download the deck.
    let decksToDownload = [];
    for (let server_deck_id of serverCollection.deck_ids) {
      if (!userCollection.deck_ids.includes(server_deck_id)) {
        decksToDownload.push(server_deck_id);
      }
    }
    if (decksToDownload.length > 0) {
      let downloadCallData = {
        url: data.serverURL + "/get_decks",
        jwt: data.jwt,
        method: "POST",
        data: decksToDownload
      };
      let downloadDecksCallResults = null;
      await callAPI(downloadCallData).then(data => {
        downloadDecksCallResults = data;
      });
      console.log("    decks downloaded: ", downloadDecksCallResults)
      if (downloadDecksCallResults === null) {
        return null;
      } else {
        for (let downloadedDeck of downloadDecksCallResults) {
          decks.unshift(downloadedDeck);
          userCollection.deck_ids.push(downloadedDeck.deck_id);
          postMessage({
            mutation: "addDeck",
            payload: downloadedDeck
          });
        }
      }
    }
    // if there are new decks locally, add their IDs, post the deck.
    let decksToPost = [];
    for (let client_deck_id of userCollection.deck_ids) {
      if (!serverCollection.deck_ids.includes(client_deck_id)) {
        let deckToPostLst = decks.filter(function(deckToCheck) {
          return deckToCheck.deck_id === client_deck_id;
        });
        if (deckToPostLst.length > 0) {
          let deckToPost = deckToPostLst[0];
          decksToPost.push(deckToPost);
        }
      }
    }
    if (decksToPost.length > 0) {
      console.log('    posting decks ', decksToPost)
      let postCallData = {
        url: data.serverURL + "/post_decks",
        jwt: data.jwt,
        method: "POST",
        data: decksToPost
      };
      let postDecksResult = null;
      await callAPI(postCallData).then(data => {
        postDecksResult = data;
      });
      console.log("    POSTed decks ", postDecksResult)
      if (postDecksResult === null) {
        return null;
      }
    }
    // sync settings changes
    if (serverCollection.webapp_settings !== userCollection.webapp_settings) {
      if (
        serverCollection.webapp_settings.edited >
        userCollection.webapp_settings.edited
      ) {
        postMessage({
          mutation: "updateSettings",
          payload: serverCollection.webapp_settings
        });
      }
      if (
        serverCollection.webapp_settings.edited <
        userCollection.webapp_settings.edited
      ) {
        console.log('posting settings')
        let putSettingsData = {
          url: data.serverURL + "/put_user_collection",
          jwt: data.jwt,
          method: "PUT",
          data: {
            webapp_settings: userCollection.webapp_settings
          }
        };
        let putSettingsResult = null;
        await callAPI(putSettingsData).then(data => {
          putSettingsResult = data;
        });
        console.log("    PUT webapp settings", putSettingsResult)
        if (putSettingsResult === null) {
          return null;
        }
      }
    }
    // sync schedule changes
    if (serverCollection.schedule !== userCollection.schedule) {
      if (serverCollection.schedule.edited > userCollection.schedule.edited) {
        postMessage({
          mutation: "updateSchedule",
          payload: serverCollection.schedule
        });
      }
      if (serverCollection.schedule.edited < userCollection.schedule.edited) {
        console.log('posting settings')
        let putSettingsData = {
          url: data.serverURL + "/put_user_collection",
          jwt: data.jwt,
          method: "PUT",
          data: {
            schedule: userCollection.schedule
          }
        };
        let putSettingsResult = null;
        await callAPI(putSettingsData).then(data => {
          putSettingsResult = data;
        });
        console.log("      Put schedule changes", putSettingsResult)
        if (putSettingsResult === null) {
          return null;
        }
      }
    }
  }
  // decks meta comparisons
  let decksToPut = [];
  let decksToUpdateLocally = [];
  // compare the edited dates for each deck in local and server decks meta
  for (let localDeckMeta of localDecksMeta) {
    for (let serverDeckMeta of serverDecksMeta) {
      if (localDeckMeta.deck_id === serverDeckMeta.deck_id) {
        // if the local version is newer, upload it
        //  console.log('    localDeckMeta.edited',localDeckMeta.edited)
        //  console.log('    serverDeckMeta.edited',serverDeckMeta.edited)
        if (localDeckMeta.edited > serverDeckMeta.edited) {
          for (let deckToPut of decks) {
            if (deckToPut.deck_id === localDeckMeta.deck_id) {
              decksToPut.push(deckToPut);
              break;
            }
          }
        }
        // if the server version is newer, downlaod it
        else if (localDeckMeta.edited < serverDeckMeta.edited) {
          decksToUpdateLocally.push(serverDeckMeta.deck_id);
        }
      }
    }
  }
  // upload all the decks to put
  if (decksToPut.length > 0) {
    console.log('     PUTing decks', decksToPut)
    let putDecksData = {
      url: data.serverURL + "/put_decks",
      jwt: data.jwt,
      method: "PUT",
      data: decksToPut
    };
    let putDecksResult = null;
    await callAPI(putDecksData).then(data => {
      putDecksResult = data;
    });
    console.log("      Put decks: ", putDecksResult)
    if (putDecksResult === null) {
      return null;
    }
  }
  // get all newer server decks
  if (decksToUpdateLocally.length > 0) {
    console.log('     GETing decks', decksToPut)
    let getDecksData = {
      url: data.serverURL + "/get_decks",
      jwt: data.jwt,
      method: "POST",
      data: decksToUpdateLocally
    };
    let getDecksResult = null;
    await callAPI(getDecksData).then(data => {
      getDecksResult = data;
    });
    if (getDecksResult === null) {
      return null;
    } else {
      console.log("    decks downloaded", getDecksResult)
      for (let newerDeck of getDecksResult) {
        let oldDeckLst = decks.filter(function(deckToCheck) {
          return deckToCheck.deck_id === newerDeck.deck_id;
        });
        if (oldDeckLst.length > 0) {
          let oldDeck = oldDeckLst[0];
          let oldDeckIndex = decks.indexOf(oldDeck);
          decks.splice(oldDeckIndex, 1);
          decks.push(newerDeck);
          postMessage({
            mutation: "updateDeck",
            payload: {
              deck: newerDeck,
              fromSync: true
            }
          });
        }
      }
    }
  }
  postMessage({
    mutation: "updateLastSyncsData",
    payload: {
      decks: decks,
      userCollection: userCollection
    }
  });
  // console.log('    set last sync data',{
  //   decks: decks,
  //   userCollection: userCollection
  // } )
  postMessage({
    mutation: "toggleSyncing",
    payload: false
  });
}

onmessage = e => {
  cloudSync(e.data);
};

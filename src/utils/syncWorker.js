/* eslint-disable */
import {
  isEqual
} from 'lodash/core';
import {
  isEmpty
} from 'lodash'
const axios = require('axios');
async function callAPI(data) {
  let result = null;
  const options = {
    url: data.url,
    headers: {
      'Content-Type': 'application/json',
      'x-access-token': data.jwt,
    },
    method: data.method,
  };
  if (data.data) {
    options.data = data.data;
  }
  await axios(options)
    .then(response => {
      result = response.data;
    })
    .catch(function (err) {
      postMessage({
        mutation: 'toggleSyncing',
        payload: false,
      });
      postMessage({
        mutation: 'toggleSyncFailed',
        payload: true,
      });
      console.log(err);
    });
  return result;
}
async function cloudSync(data) {
  const decks = data.decks;
  const userCollection = data.user_collection;
  const lastSyncsData = data.lastSyncsData;
  console.log('    sync called. skip equality check?', data.skipSameCheck)
  console.log('lastSyncsData.user_collection, userCollection', lastSyncsData.user_collection, userCollection);
  console.log('lastSyncsData.decks, decks', lastSyncsData.decks, decks)
  if (!data.skipSameCheck) {
    if (
      isEqual(lastSyncsData.user_collection, userCollection) &&
      isEqual(lastSyncsData.decks, decks)
    ) {
      console.log('equality with last syncs data');
      return null;
    }
  }
  postMessage({
    mutation: 'toggleSyncing',
    payload: true,
  });
  if (data.syncing || userCollection.user_id === 'Tutorial') {
    console.log('    syncing blocked');
    postMessage({
      mutation: 'toggleSyncing',
      payload: false,
    });
    return null;
  }
  if (!data.online || lastSyncsData === null) {
    console.log('!online, lastSyncData == null');
    postMessage({
      mutation: 'toggleSyncFailed',
      payload: true,
    });
    postMessage({
      mutation: 'toggleSyncing',
      payload: false,
    });
    // toggle sync to show we tried, this makes sure initial sync will always be incremented at startup
    return null;
  }

  postMessage({
    mutation: 'toggleSyncFailed',
    payload: false,
  });
  console.log('    starting sync');
  const localDecksMeta = data.decksMeta;
  let serverDecksMeta = null;
  const getMetaDataCall = {
    url: data.serverUrl + '/get_decks_meta_and_collection',
    jwt: data.jwt,
    method: 'GET',
  };
  let metaDataCallResults = null;
  await callAPI(getMetaDataCall).then(data => {
    metaDataCallResults = data;
  });
  console.log('    Get Meta and Collection ', metaDataCallResults);
  if (metaDataCallResults === null) {
    return null;
  }
  const serverCollection = metaDataCallResults.user_collection;
  serverDecksMeta = metaDataCallResults.decks_meta;
  // user collections comparisons
  if (!isEqual(serverCollection, userCollection)) {
    const mergedDeletedDeckIds = serverCollection.deleted_deck_ids.concat(
      userCollection.deleted_deck_ids.filter(entry => !serverCollection.deleted_deck_ids.includes(entry))
    );
    if (!isEqual(serverCollection.deleted_deck_ids, mergedDeletedDeckIds)){
       console.log('putting section: deleted deck Ids');
            const putSectionData = {
              url: data.serverUrl + '/put_user_collection',
              jwt: data.jwt,
              method: 'PUT',
              data: {
               deleted_deck_ids: mergedDeletedDeckIds,
              },
            };
            let putSectionResult = null;
            await callAPI(putSectionData).then(data => {
              putSectionResult = data;
            });
            console.log('    PUT section results', putSectionResult);
            if (putSectionResult === null) {
              return null;
            }
    }
    for (const serverDeletedDeckId of serverCollection.deleted_deck_ids) {
      // if server deleted, but local deleted isn't, delete locally
      if (!userCollection.deleted_deck_ids.includes(serverDeletedDeckId)) {
        // add to local user_collection deleted list
        userCollection.deleted_deck_ids.push(serverDeletedDeckId);
        // remove from user_collection included list
        const deckIdIndex = userCollection.deck_ids.indexOf(serverDeletedDeckId);
        // if its actually in local
        if (deckIdIndex !== -1) {
          userCollection.deck_ids.splice(deckIdIndex, 1);
          // remove the deck from 'decks'  // note this is only for 'lastsyncsdata' purposes.
          const deckToDeleteFilter = decks.filter(function (deckToCheck) {
            return deckToCheck.deck_id === serverDeletedDeckId;
          });
          const deckToDelete = deckToDeleteFilter[0];
          const deckIndex = decks.indexOf(deckToDelete);
          if (deckIndex !== -1) {
            // just in case its not there alraady
            decks.splice(deckIndex, 1);
          }
          postMessage({
            mutation: 'deleteDeck',
            payload: serverDeletedDeckId,
          });
        }
      }
    }
    if (!isEqual(userCollection.deleted_deck_ids, mergedDeletedDeckIds)) userCollection.deleted_deck_ids = mergedDeletedDeckIds
    // if local deleted, but server deleted isn't, add to server deleted list
    const decksToDeleteOnServer = [];
    for (const clientDeletedDeckId of userCollection.deleted_deck_ids) {
      if (!serverCollection.deleted_deck_ids.includes(clientDeletedDeckId)) {
        decksToDeleteOnServer.push(clientDeletedDeckId);
      }
    } // call delete decks (server will update it's deleted decks list on its end)
    if (decksToDeleteOnServer.length > 0) {
      const deleteCallData = {
        url: data.serverUrl + '/delete_decks',
        jwt: data.jwt,
        method: 'DELETE',
        data: {
          deck_ids: decksToDeleteOnServer,
        },
      };
      let deleteDecksCallResults = null;
      await callAPI(deleteCallData).then(data => {
        deleteDecksCallResults = data;
      });
      console.log('    decks deleted: ', deleteDecksCallResults);
      if (deleteDecksCallResults === null) {
        return null;
      }
    }
    // if there are new decks from server, add their IDs, download the deck.
    const decksToDownload = [];
    for (const serverDeckId of serverCollection.deck_ids) {
      if (!userCollection.deck_ids.includes(serverDeckId)) {
        decksToDownload.push(serverDeckId);
      }
    }
    console.log(decksToDownload)
    if (decksToDownload.length > 0) {
      const downloadCallData = {
        url: data.serverUrl + '/get_decks',
        jwt: data.jwt,
        method: 'POST',
        data: decksToDownload,
      };
      let downloadDecksCallResults = null;
      await callAPI(downloadCallData).then(data => {
        downloadDecksCallResults = data;
      });
      console.log('    decks downloaded: ', downloadDecksCallResults);
      const newDecks = downloadDecksCallResults.decks
      const notFound = downloadDecksCallResults.not_found
      console.log('notFound', notFound)
      console.log('newDecks', newDecks)
      if (!isEmpty(newDecks))
        for (const downloadedDeck of newDecks) {
          decks.unshift(downloadedDeck);
          userCollection.deck_ids.push(downloadedDeck);
          postMessage({
            mutation: 'addDeck',
            payload: downloadedDeck,
          });
        }
      // if (!isEmpty(notFound))
      //   for (const notFoundDeck of notFound) {
      //     // this shouldn't happen, it was cause I deleted decks manually from the pgadmin
      //     console.log('notFoundDeck', notFoundDeck)
      //     console.log('userCollection.deck_ids', userCollection.deck_ids)
      //     userCollection.deck_ids.splice(userCollection.deck_ids.indexOf(notFoundDeck), 1)
      //     console.log('userCollection.deck_ids', userCollection.deck_ids)
      //     userCollection.deleted_deck_ids.push(notFoundDeck)
      //   }
    }
    // if there are new decks locally, add their IDs, post the deck.
    const decksToPost = [];
    for (const clientDeckId of userCollection.deck_ids) {
      if (!serverCollection.deck_ids.includes(clientDeckId)) {
        const deckToPostLst = decks.filter(function (deckToCheck) {
          return deckToCheck.deck_id === clientDeckId;
        });
        if (!isEmpty(deckToPostLst)) {
          decksToPost.push(deckToPostLst[0]);
        }
      }
    }
    if (!isEmpty(decksToPost)) {
      console.log('    posting decks ', decksToPost);
      const postCallData = {
        url: data.serverUrl + '/post_decks',
        jwt: data.jwt,
        method: 'POST',
        data: decksToPost,
      };
      let postDecksResult = null;
      await callAPI(postCallData).then(data => {
        postDecksResult = data;
      });
      console.log('    POSTed decks ', postDecksResult);
      if (postDecksResult === null) {
        return null;
      }
    }
    // sync settings, schedule, all_card_tags, highlight_urls  //later extension settings. any one with 'edited'
    for (const section in userCollection) {
      if (section === 'webapp_settings' || section === 'schedule' || section === 'all_card_tags' || section === 'highlight_urls') {
        let sectionPascal
        if (section === 'webapp_settings') sectionPascal = 'WebappSettings'
        if (section === 'schedule') sectionPascal = 'Schedule'
        if (section === 'all_card_tags') sectionPascal = 'AllCardTags'
        if (section === 'highlight_urls') sectionPascal = 'HighlightUrls'
        if (isEmpty(serverCollection[section])) serverCollection[section] = {
          edited: 0
        }
        if (isEmpty(userCollection[section])) userCollection[section] = {
          edited: 0
        }
        if (!isEqual(serverCollection[section], userCollection[section])) {
          console.log('serverCollection[section], userCollection[section]', serverCollection[section], userCollection[section])
          if (serverCollection[section].edited > userCollection[section].edited) {
            console.log('updating local section: ', section);
            postMessage({
              mutation: 'update' + sectionPascal,
              payload: serverCollection[section],
            });
            userCollection[section] = serverCollection[section]
          } else if (serverCollection[section].edited < userCollection[section].edited) {
            console.log('putting section: ', section);
            const putSectionData = {
              url: data.serverUrl + '/put_user_collection',
              jwt: data.jwt,
              method: 'PUT',
              data: {
                [section]: userCollection[section],
              },
            };
            let putSectionResult = null;
            await callAPI(putSectionData).then(data => {
              putSectionResult = data;
            });
            console.log('    PUT section results', putSectionResult);
            if (putSectionResult === null) {
              return null;
            }
          }
        }
      }
    }
    // sync settings changes
    // if (serverCollection.webapp_settings !== userCollection.webapp_settings) {
    //   if (serverCollection.webapp_settings.edited > userCollection.webapp_settings.edited) {
    //     postMessage({
    //       mutation: 'updateSettings',
    //       payload: serverCollection.webapp_settings,
    //     });
    //   }
    //   if (serverCollection.webapp_settings.edited < userCollection.webapp_settings.edited) {
    //     console.log('posting settings');
    //     const putSettingsData = {
    //       url: data.serverUrl + '/put_user_collection',
    //       jwt: data.jwt,
    //       method: 'PUT',
    //       data: {
    //         webapp_settings: userCollection.webapp_settings,
    //       },
    //     };
    //     let putSettingsResult = null;
    //     await callAPI(putSettingsData).then(data => {
    //       putSettingsResult = data;
    //     });
    //     console.log('    PUT webapp settings', putSettingsResult);
    //     if (putSettingsResult === null) {
    //       return null;
    //     }
    //   }
    // }
    // // sync schedule changes
    // if (serverCollection.schedule !== userCollection.schedule) {
    //   if (serverCollection.schedule.edited > userCollection.schedule.edited) {
    //     postMessage({
    //       mutation: 'updateSchedule',
    //       payload: serverCollection.schedule,
    //     });
    //   }
    //   if (serverCollection.schedule.edited < userCollection.schedule.edited) {
    //     console.log('posting settings');
    //     const putSettingsData = {
    //       url: data.serverUrl + '/put_user_collection',
    //       jwt: data.jwt,
    //       method: 'PUT',
    //       data: {
    //         schedule: userCollection.schedule,
    //       },
    //     };
    //     let putSettingsResult = null;
    //     await callAPI(putSettingsData).then(data => {
    //       putSettingsResult = data;
    //     });
    //     console.log('      Put schedule changes', putSettingsResult);
    //     if (putSettingsResult === null) {
    //       return null;
    //     }
    //   }
    // }
  }
  // decks meta comparisons
  const decksToPut = [];
  const decksToUpdateLocally = [];
  // compare the edited dates for each deck in local and server decks meta
  // console.log('localDecksMeta, serverDecksMeta', localDecksMeta, serverDecksMeta)
  for (const localDeckMeta of localDecksMeta) {
    for (const serverDeckMeta of serverDecksMeta) {
      if (localDeckMeta.deck_id === serverDeckMeta.deck_id) {
        // if the local version is newer, upload it
        //  console.log('    localDeckMeta.edited',localDeckMeta.edited)
        //  console.log('    serverDeckMeta.edited',serverDeckMeta.edited)
        if (Math.round(localDeckMeta.edited) > Math.round(serverDeckMeta.edited)) {
          for (const deckToPut of decks) {
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
  if (!isEmpty(decksToPut)) {
    console.log('     PUTting decks', decksToPut);
    const putDecksData = {
      url: data.serverUrl + '/put_decks',
      jwt: data.jwt,
      method: 'PUT',
      data: decksToPut,
    };
    let putDecksResult = null;
    await callAPI(putDecksData).then(data => {
      putDecksResult = data;
    });
    console.log('      Put decks: ', putDecksResult);
    if (putDecksResult === null) {
      return null;
    }
  }
  // get all newer server decks
  if (decksToUpdateLocally.length > 0) {
    console.log('     GETing decks', decksToPut);
    const getDecksData = {
      url: data.serverUrl + '/get_decks',
      jwt: data.jwt,
      method: 'POST',
      data: decksToUpdateLocally,
    };
    let getDecksResult = null;
    await callAPI(getDecksData).then(data => {
      getDecksResult = data;
    });
    if (getDecksResult === null) {
      return null;
    } else {
      console.log('    decks downloaded', getDecksResult);
      if (!isEmpty( getDecksResult.decks))
      for (const newerDeck of getDecksResult.decks) {
        const oldDeckLst = decks.filter(function (deckToCheck) {
          return deckToCheck.deck_id === newerDeck.deck_id;
        });
        if (oldDeckLst.length > 0) {
          const oldDeck = oldDeckLst[0];
          const oldDeckIndex = decks.indexOf(oldDeck);
          decks.splice(oldDeckIndex, 1);
          decks.push(newerDeck);
          postMessage({
            mutation: 'updateDeck',
            payload: {
              deck: newerDeck,
              fromSync: true,
            },
          });
        }
      }
    }
  }
  postMessage({
    mutation: 'updateLastSyncsData',
    payload: {
      decks: decks,
      user_collection: userCollection,
    },
  });
  // console.log('    set last sync data',{
  //   decks: decks,
  //   user_collection: userCollection
  // } )
  postMessage({
    mutation: 'toggleSyncing',
    payload: false,
  });
}
onmessage = e => {
  cloudSync(e.data);
};
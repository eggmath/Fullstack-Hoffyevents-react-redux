import moment from 'moment';
import {toastr} from 'react-redux-toastr';
import cuid from 'cuid'
import {AsyncActionStart, AsyncActionFinished, AsyncActionError} from '../../Async/AsyncActionCreator'
import firebase from '../../../config/index'
import {FETCH_EVENT} from '../../event/eventActions/actionsType'



export const updateProfile = (user) => {
    return async (dispatch, getState, {getFirebase}) => {
        const firebase = getFirebase();
        const {isLoaded, isEmpty, ...updatedUser} =user;

        if(updatedUser.dateOfBirth !== getState().firebase.profile.dateOfBirth) {
             updatedUser.dateOfBirth = moment(updatedUser.dateOfBirth).toDate();
        }

        try {
             await firebase.updateProfile(updatedUser);
             toastr.success('success', 'Profile updated')
        } catch(error) {
             console.log(error)
        }

    }
}

export const uploadProfileImage=(file, fileName) => 
async(dispatch, getState, {getFirebase, getFirestore}) => {
     
    const ImageName = cuid()
     const firebase= getFirebase();
     const firestore= getFirestore();
     const user = firebase.auth().currentUser;
     const path= `${user.uid}/user_images`;
     const options = {
         name:ImageName
     };
     try {
         dispatch(AsyncActionStart())
         //update the file to firebase storage
      let uploadedFile = await firebase.uploadFile(path, file, null, options);
      //get url of image
      let downloadURL= await uploadedFile.uploadTaskSnapshot.downloadURL;
       //get  userdoc
      let userDoc= await firestore.get(`users/${user.uid}`);
      //check if user his photo, if not update profile with new image
      if(!userDoc.data().photoURL){
          await firebase.updateProfile({
              photoURL:downloadURL
          });
          await user.updateProfile({
              photoURL:downloadURL
          })  
      }
 
         //add the new photo to photos collection
          await  firestore.add({
             collection:'users',
             doc:user.uid,
             subcollections:[{collection:'photos'}]
         }, {
             name:ImageName,
             url:downloadURL

         })

         dispatch(AsyncActionFinished())
     }
      catch(error) {
          dispatch(AsyncActionError())
          console.log(error)
          throw new Error('problem uploading photo');
      }
}

export const setMainPhoto = photo => 
async(dispatch, getState, {getFirebase}) => {
    const firebase= getFirebase();
    try {
        return await firebase.updateProfile({
            photoURL:photo.url
             
        })



    } catch(error) {
        console.log(error);
        throw new Error('Problem setting main photo')

    }

}


export const deletePhoto =(photo)=> 
async(dispatch, getState, {getFirebase, getFirestore}) => {
    const firebase= getFirebase();
    const firestore = getFirestore();
    const user = firebase.auth().currentUser;
    try {
         await firebase.deleteFile(`${user.uid}/user_images/${photo.name}`);
         await firestore.delete({
             collection:'users',
             doc:user.uid,
             subcollections:[{collection:'photos', doc:photo.id}]
         })
 
    } catch(error) {
        console.log(error);
        throw new Error('Problem setting main photo')

    }

}



export const goingEvent =(event) => {
  return  async (dispatch, getState,{getFirestore}) => {
        const firestore = getFirestore();
        const user = firestore.auth().currentUser;
        const photoURL=getState().firebase.profile.photoURL;
        const attendee = {
             going:true,
             joinDate:Date.now(),
             photoURL:photoURL|| '/assets/user.png',
             displayName:user.displayName,
             host:false    
        }
         try {
             await firestore.update(`events/${event.id}`, {
                 [`attendees.${user.uid}`]:attendee
             })

             await firestore.set(`event_attendee/${event.id}_${user.uid}`,{
                 eventId:event.id,
                 userUid:user.uid,
                 eventDate:event.date,
                 host:false
             })
             toastr.success('success', 'you have signed up to the event');

         } catch(error) {
             console.log(error)
             toastr.error('Oops', 'problem signup up to event')
         }
    }
}


export const CancelGoingToEvent =(event) => {
     return async(dispatch, getState,{getFirestore}) => {
         const firestore = getFirestore();
         const user=firestore.auth().currentUser;

         try {
             await firestore.update(`events/${event.id}`,{
              [`attendees.${user.uid}`]:firestore.FieldValue.delete()   
             })
             await firestore.delete(`event_attendee/${event.id}_${user.uid}`);
             toastr.success('Success', 'You have removeed yourself from the event');

         } catch(error) {
          console.log(error)
          toastr.error('Success', 'Something went wrong');
         }

     }

}



export const getUserEvents =(userUid, activeTab) => {

    return async (dispatch, getState) => {
        dispatch(AsyncActionStart());
            const firestore = firebase.firestore();
            const today = new Date(Date.now());
            let eventRef= firestore.collection('event_attendee') 
            let query;

            switch(activeTab) {
                case 1: //past Events
                query= eventRef
                .where('userUid', '==', userUid)
                .where('eventDate', '<=',today)
                .orderBy('eventDate', 'desc');
                break;

                case 2: //future Events
                query= eventRef
                .where('userUid', '==', userUid)
                .where('eventDate', '>=',today)
                .orderBy('eventDate');
                break;

                case 3: //hosted Events
                query= eventRef
                .where('userUid', '==', userUid)
                .where('host', '==',true)
                .orderBy('eventDate','desc');
                break;
                default:
                query= eventRef
                .where('userUid', '==', userUid)
                .orderBy('eventDate','desc');

            } 
            try {
                 let querySnap = await query.get();

                 let events =[];

                 for(let i=0; i<querySnap.docs.length; i++) {
                     let evt = await firestore.collection('events').doc(querySnap.docs[i].data().eventId).get();
                     events.push({...evt.data(), id: evt.id})
                 }
                 dispatch({type:FETCH_EVENT, payload:{events}})
                
                 dispatch(AsyncActionFinished())
            }
              catch(error) {
                  console.log(error)
                  dispatch(AsyncActionError())
              }

        
    }


}



export const  followUser = userToFollow => 
async (dispatch, getState, {getFirestore}) => {
    const firestore = getFirestore();
    const user = firestore.auth().currentUser;

    const following = {
         photoURL:userToFollow.photoURL|| '/assets/user.png',
         city:userToFollow.city || 'Unknown City',
         displayName:userToFollow.displayName
    };
     try {
         await firestore.set( {
            collection:'users',
            doc:user.uid,
            subcollections:[{collection:'following', doc:userToFollow.id}]

         },
         following
         );
        
     }

      catch(error) {
         console.log(error);
     }





}











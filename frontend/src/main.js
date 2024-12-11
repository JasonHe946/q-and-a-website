import { BACKEND_PORT } from "./config.js";
// A helper you may want to use when uploading new images to the server.
import { fileToDataUrl } from "./helpers.js";

let threadListCount = 0;
let threadListArray = [];
let threadsByUser = [];

// refresh threads on side list thread bar
function refreshThreads() {
	document.getElementById('thread-list').textContent = '';
	threadListCount = 0;
	threadListArray = [];
	printThreads(threadListCount);
}

// add DOM elements for each thread in threadlist sidebar
function addThreadDOM(data) {
	const threadList = document.getElementById('thread-list');
	for (const entry of data) {
		threadListArray.push(entry.id);
		const div = document.createElement('div');
		const p1 = document.createElement('p');
		const t1 = document.createTextNode(`Title: ${entry.title}     ${entry.likes.length} ❤️`);
		let t2 = null;
		insertCreatorName(entry.creatorId).then(nameData => {
			t2 = document.createTextNode(`Posted by ${nameData.name} on ${formatDate(entry.createdAt)}`);
			p1.appendChild(t1);
			p1.appendChild(document.createElement('br'));
			p1.appendChild(t2);
			div.appendChild(p1);
		})
		div.classList.add('thread-list-ind-thread');
		div.setAttribute('data-threadid', entry.id);
		div.addEventListener('click', (event) => {
			const threadId = div.getAttribute('data-threadid');
			updateIndThread(threadId);
		});
		threadList.appendChild(div);
	}
	threadListCount += data.length;

	// check to see if there are still threads
	generalGetApiCall('threads',{start:threadListCount}, token)
	.then(threadIds => {
		if (threadIds.length === 0) {
			document.getElementById("more-thread-btn").style.display = 'none';
		} else {
			document.getElementById("more-thread-btn").style.display = 'block';
		}
	})
};

// function for loading up an individual thread
function updateIndThread(id) {
	generalGetApiCall('thread', {id: id}, token)
	.then(data => {
		// go from dashboard to individual thread page
		document.getElementById("subpage-dashboard-content").style.display = 'none';
		document.getElementById("subpage-individual-thread").style.display = 'block';

		// load appropriate title, content and likes
		const title = document.getElementById("ind-thread-title");
		const content = document.getElementById("ind-thread-content");
		const likes = document.getElementById("ind-thread-likes");
		title.textContent = `${data.title}`;
		content.textContent = `${data.content}`;
		likes.textContent = `${data.likes.length}`;

		// set the rest of the div attributes
		const subPageThreadDiv = document.getElementById("subpage-individual-thread");
		subPageThreadDiv.setAttribute('data-is-locked', data.lock);
		subPageThreadDiv.setAttribute('data-thread-id', data.id);
		subPageThreadDiv.setAttribute('data-is-public', data.isPublic);
		subPageThreadDiv.setAttribute('data-content', data.content);
		subPageThreadDiv.setAttribute('data-title', data.title);
		subPageThreadDiv.setAttribute('data-created', data.createdAt);
		subPageThreadDiv.setAttribute('data-creator-id', data.creatorId);
		subPageThreadDiv.setAttribute('data-likes', JSON.stringify(data.likes));
		subPageThreadDiv.setAttribute('data-watchees', JSON.stringify(data.watchees));

		// embedd the threadId into the edit, delete and like button
		document.getElementById("edit-thread-btn").setAttribute('data-threadid', id);
		document.getElementById("delete-thread-btn").setAttribute('data-threadid', id);
		document.getElementById("like-thread-btn").setAttribute('data-threadid', id);

		// show or hide edit and delete buttons based on user
		if (parseInt(userId) === data.creatorId || currIsAdmin === "true") {
			document.getElementById("edit-thread-btn").style.display = 'block';
			document.getElementById("delete-thread-btn").style.display = 'block';
		} else {
			document.getElementById("edit-thread-btn").style.display = 'none';
			document.getElementById("delete-thread-btn").style.display = 'none';
		}
		// show if page is already liked or not
		if (data.likes.includes(parseInt(userId))) {
			document.getElementById("heart-btn").classList.add("heart-filled");
			document.getElementById("like-thread-btn").textContent = `Liked ❤️`;
			document.getElementById("like-thread-btn").classList.add('btn-danger');
		} else {
			document.getElementById("heart-btn").classList.remove("heart-filled");
			document.getElementById("like-thread-btn").textContent = `Like`;
			document.getElementById("like-thread-btn").classList.remove('btn-danger');
		}
		// show if thread is already watched or not
		if (data.watchees.includes(parseInt(userId))) {
			// document.getElementById("watch-icon").classList.add('watch-on');
			document.getElementById("watch-thread-btn").classList.add('btn-info');
			document.getElementById("watch-thread-btn").textContent = "Watching 👁️";
		} else {
			// document.getElementById("watch-icon").classList.remove('watch-on');
			document.getElementById("watch-thread-btn").classList.remove('btn-info');
			document.getElementById("watch-thread-btn").textContent = "Watch";
		}
		// update profile picture
		const threadCreatorPic = document.getElementById("thread-creator-pic");
		threadCreatorPic.classList.add('thread-profile-picture')
		profilePicInsert(data.creatorId).then(imgData => {
			threadCreatorPic.src = imgData.image;
		})
		const timeSinceThread = document.getElementById("time-since-thread-create");
		timeSinceThread.textContent = `Posted ${timeSincePost(data.createdAt)} by`;

		const threadCreatorId = data.creatorId;
		const threadCreator = document.getElementById("thread-creator-link");
		insertCreatorName(threadCreatorId).then(innerData => {
			threadCreator.textContent = innerData.name;
		})

		// refresh comments
		document.getElementById("comment-list").textContent = '';
		generalGetApiCall('comments',{
			threadId: getThreadId()
		}, token).then(data => {
			let comments = []
			comments = data;
			comments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
			createCommentElements(comments);
		})
		.catch(error => alert(error))
	})
}

// function to print threads
function printThreads(start) {
	generalGetApiCall('threads',{start:start}, token)
	.then(threadIds => {
		Promise.all(threadIds.map((threadId) => generalGetApiCall('thread', {id: threadId}, token)))
			.then((data => {
				addThreadDOM(data);
			}))
	})
}

// functions to switch pages in single page app
const pages = ['login', 'register', 'dashboard', 'create-thread', 'user-profile'];

function goToPage(page) {
	for (const currentPage of pages) {
		document.getElementById(`page-${currentPage}`).style.display = 'none';
	}
	document.getElementById(`page-${page}`).style.display = 'block';
	if (page === 'dashboard') {
		refreshThreads();
		document.getElementById("subpage-dashboard-content").style.display = 'block';
		document.getElementById("subpage-individual-thread").style.display = 'none';
	}
}

document.getElementById('goto-page-register').addEventListener('click', () => {
    goToPage('register');
})

document.getElementById('goto-page-login').addEventListener('click', () => {
    goToPage('login');
})

document.getElementById('goto-page-dashboard').addEventListener('click', () => {
    goToPage('dashboard');
})

document.getElementById('goto-page-profile').addEventListener('click', () => {
    goToPage('user-profile');
	document.getElementById("page-user-profile").setAttribute('data-user-id', userId)
	updateUserProfile();
})


// login and logout authentication functions

function setLoggedIn(isLoggedIn) {
	if (isLoggedIn) {
		document.getElementById('logged-out-btns').style.display = 'none';
		document.getElementById('logged-in-btns').style.display = 'block';
		setLoginToken();
		setUserId();
	} else {
		document.getElementById('logged-out-btns').style.display = 'block';
		document.getElementById('logged-in-btns').style.display = 'none';
		localStorage.removeItem('token');
		localStorage.removeItem('userId');
		localStorage.removeItem('currIsAdmin');
	}
}

document.getElementById('logout-btn').addEventListener('click', () => {
	goToPage('login');
	setLoggedIn(false);
})

let token = null;
let userId = null;
let currIsAdmin = null;
const setLoginToken = () => {
	token = localStorage.getItem('token');
}
const setUserId = () => {
	userId = localStorage.getItem('userId')
}

const setCurrIsAdmin = () => {
	currIsAdmin = localStorage.getItem('currIsAdmin')
}

if (localStorage.getItem('token')) {
	setLoggedIn(true);
	setLoginToken();
	setUserId();
	setCurrIsAdmin();
	goToPage('dashboard');
} else {
	setLoggedIn(false);
}

function setStorageAdmin(currUser, currToken) {
	generalGetApiCall('user', {
		userId: currUser
	}, currToken)
		.then(data => {
			localStorage.setItem('currIsAdmin', data.admin);
			currIsAdmin = data.admin;
		})
		.catch(error => alert(error))
}

// function for formatting string 
function formatDate(dateString) {
    const date = new Date(dateString);

    // Extract the day, month, and year
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
}

// function for authentication api call
function authApiCall(route, body) {
	return new Promise((resolve, reject) => {
		fetch(`http://localhost:5005/${route}`, {
			method: "POST",
			headers: {
				"Content-type": "application/json",
			},
			body: JSON.stringify(body),
		})
		.then(response => response.json())
		.then((data => {
			if (data.error) {
				reject(data.error);
			} else {
				resolve(data);
			}
		}));
	});
}

// function for general api call
function generalApiCall(route, body, token, method) {
	return new Promise((resolve, reject) => {
		fetch(`http://localhost:5005/${route}`, {
			method: method,
			headers: {
				"Content-type": "application/json",
				'Authorization': `Bearer ${token}`
			},
			body: JSON.stringify(body),
		})
		.then(response => response.json())
		.then((data => {
			if (data.error) {
				reject(data.error);
			} else {
				resolve(data);
			}
		}));
	});
}

// function for general get api call
function generalGetApiCall(route, params, token,) {
	const query = new URLSearchParams(params);
	return new Promise((resolve, reject) => {
		fetch(`http://localhost:5005/${route}?${query}`, {
			method: 'GET',
			headers: {
				"Content-type": "application/json",
				'Authorization': `Bearer ${token}`
			}
		})
		.then(response => response.json())
		.then((data => {
			if (data.error) {
				reject(data.error);
			} else {
				resolve(data);
			}
		}));
	});
}

// event listener for register button
document.getElementById("register-btn").addEventListener("click", () => {
	const email = document.getElementById("register-email").value;
	const password = document.getElementById("register-password").value;
	const confirmPassword = document.getElementById("confirm-register-password").value;
	const name = document.getElementById("register-name").value;
	if (password !== confirmPassword) {
		alert("Passwords do not match");
		return;
	}

	authApiCall('auth/register', {
		email, 
		password, 
		name
	}).then(data => {
		localStorage.setItem('token', data.token);
		localStorage.setItem('userId', data.userId);
		setStorageAdmin(data.userId, data.token);
		setLoggedIn(true);
		goToPage('dashboard');
	}).catch(error => {
		alert(error);
	});
});

// event listener for login button
document.getElementById("login-btn").addEventListener("click", () => {
	const email = document.getElementById("login-email").value;
	const password = document.getElementById("login-password").value;
	authApiCall('auth/login', {
		email,
		password
	}).then(data => {
		localStorage.setItem('token', data.token);
		localStorage.setItem('userId', data.userId);
		setStorageAdmin(data.userId, data.token);
		setLoggedIn(true);
		goToPage('dashboard');	
	}).catch(error => {
		alert(error);
	})
});

document.getElementById("create-thread-btn").addEventListener("click", (event) => {
	const title = document.getElementById("new-thread-title").value;
	const content = document.getElementById("new-thread-content").value;
	const isPublic = document.getElementById("public-thread-checkbox").checked;
	generalApiCall('thread', {
		title,
		isPublic,
		content
	}, token, 'POST')
	.then(data => {
		goToPage('dashboard');
		updateIndThread(data.id);
		// refresh create thread
		document.getElementById("new-thread-title").value = '';
		document.getElementById("new-thread-content").value = '';
		document.getElementById("public-thread-checkbox").checked = false;
	}).catch(error => {
		alert(error);
	})
});

document.getElementById('more-thread-btn').addEventListener('click', () => {
	printThreads(threadListCount);
})

document.getElementById("dashboard-create-thread-btn").addEventListener('click', () => {
	goToPage('create-thread');
})

document.getElementById("edit-thread-btn").addEventListener('click', (event) => {
	const threadDiv = document.getElementById("subpage-individual-thread").dataset;

	const threadId = threadDiv.threadId;

	// open the modal and populate the form's current values
	document.getElementById("edit-thread-modal").style.display = 'block'

	document.getElementById('edit-thread-title').value = threadDiv.title;
	document.getElementById('edit-thread-content').value = threadDiv.content;
	document.getElementById('edit-thread-isPrivate').checked = threadDiv.isPublic === "false" ? true : false;
	document.getElementById('edit-thread-isLocked').checked = threadDiv.isLocked === "true" ? true : false;
})

// add event listener for form submission
document.getElementById('editThreadForm').addEventListener('submit', (event) => {
	const threadDiv = document.getElementById("subpage-individual-thread").dataset;
	const threadId = threadDiv.threadId;
	event.preventDefault();
	const newTitle = document.getElementById('edit-thread-title').value;
	const newContent = document.getElementById('edit-thread-content').value;
	const newIsPublic = !document.getElementById('edit-thread-isPrivate').checked;
	const newIsLocked = document.getElementById('edit-thread-isLocked').checked;

	generalApiCall('thread', {
		"id": threadId,
		"title": newTitle,
		"isPublic": newIsPublic,
		"lock": newIsLocked,
		"content": newContent
	}, token, 'PUT').then(data => {
		updateIndThread(threadId)
		document.getElementById("edit-thread-modal").style.display = 'none';
	}).catch(error => {
		alert(error);
	})
})

document.getElementById("close-edit-thread-modal").addEventListener('click', () => {
	document.getElementById("edit-thread-modal").style.display = 'none';
})


document.getElementById("delete-thread-btn").addEventListener('click', (event) => {
	const div = document.getElementById("subpage-individual-thread");

	const threadid = div.dataset.threadId;

	generalApiCall('thread', {
		id: threadid
	}, token, 'DELETE').then(data => {
		// remove entry from threadListArray, then go to most recent post
		threadListArray = threadListArray.filter(item => item !== parseInt(threadid));

		if (threadListArray.length > 0) {
			updateIndThread(threadListArray[0])
			refreshThreads();
		} else {
			goToPage('dashboard')
		}
	}).catch(error => {
		alert(error);
	})
})

document.getElementById("like-thread-btn").addEventListener('click', (event) => {
	const threadDiv = document.getElementById("subpage-individual-thread");

	const threadId = threadDiv.dataset.threadId;
	const threadLocked = threadDiv.dataset.isLocked;
	if (threadLocked === "true") {
		alert("thread is locked, cannot like");
		return;
	}

	const likeThreadButton = document.getElementById("like-thread-btn");
	likeThreadButton.classList.toggle('btn-danger')
	const isLiked = likeThreadButton.classList.contains('btn-danger')

	generalApiCall('thread/like', {
		"id": threadId,
		"turnon": isLiked	
	}, token, 'PUT').then(data => {
		refreshThreads()
		updateIndThread(threadId)
	}).catch(error => {
		alert(error);
	})
})

document.getElementById("watch-thread-btn").addEventListener('click', () => {


	const watchButton = document.getElementById("watch-thread-btn");
	watchButton.classList.toggle('btn-info')
	const isWatched = watchButton.classList.contains('btn-info');

	const threadDiv = document.getElementById("subpage-individual-thread");

	const threadId = threadDiv.dataset.threadId;

	generalApiCall('thread/watch', {
		"id": threadId,
		"turnon": isWatched	
	}, token, 'PUT').then(data => {
		updateIndThread(threadId)
	}).catch(error => {
		alert(error);
	})
})

document.getElementById("make-top-level-comment-btn").addEventListener('click', () => {
	const threadDiv = document.getElementById("subpage-individual-thread");
	const threadId = threadDiv.dataset.threadId;

	const parentCommentId = null;
	const content = document.getElementById("make-top-lvl-comment").value;

	generalApiCall('comment', {
		"content": content,
		"threadId": threadId,
		"parentCommentId": parentCommentId
	}, token, 'POST')
	.then(data => {
		updateIndThread(getThreadId())
		document.getElementById("make-top-lvl-comment").value = '';
	}).catch(error => {
		alert(error);
	})
})


function timeSincePost(commentDate) {
    const now = new Date();
    const createdAt = new Date(commentDate);
    const seconds = Math.floor((now - createdAt) / 1000);
    
    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) {
        return `${interval} year${interval > 1 ? 's' : ''} ago`;
    }
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) {
        return `${interval} month${interval > 1 ? 's' : ''} ago`;
    }
    interval = Math.floor(seconds / 604800);
    if (interval >= 1) {
        return `${interval} week${interval > 1 ? 's' : ''} ago`;
    }
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) {
        return `${interval} day${interval > 1 ? 's' : ''} ago`;
    }
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) {
        return `${interval} hour${interval > 1 ? 's' : ''} ago`;
    }
    interval = Math.floor(seconds / 60);
    if (interval >= 1) {
        return `${interval} minute${interval > 1 ? 's' : ''} ago`;
    }
    return "Just now";
}

function createCommentElements(allcomments, parentCommentId = null, depth = 0) {

    // Find the container where comments will be added
    const commentsContainer = parentCommentId === null ? document.getElementById("comment-list") : document.createElement("div");

    let filteredComments = [];
	
	if (parentCommentId === null) {
		filteredComments = allcomments.filter(comment => parentCommentId === comment.parentCommentId);
	} else {
		filteredComments = allcomments.filter(comment => parentCommentId === parseInt(comment.parentCommentId))
	}

	// comment button for top level unavailable if thread lock
	const threadDiv = document.getElementById("subpage-individual-thread");
	const threadLocked = threadDiv.dataset.isLocked;
	if (threadLocked === "true") {
		document.getElementById("make-top-level-comment-btn").style.display = 'none';
		document.getElementById("make-top-lvl-comment").style.display = 'none'
	} else {
		document.getElementById("make-top-level-comment-btn").style.display = 'block';
		document.getElementById("make-top-lvl-comment").style.display = 'block'
	}



    filteredComments.forEach(comment => {
		// Create a new comment container div with styling
		const newCommentContainer = document.createElement('div');
		newCommentContainer.classList.add('new-comment-container');

        // Create an element for each comment which will contain content and profile picture
        const commentElement = document.createElement("div");
		commentElement.classList.add('comment-structure')

		commentElement.setAttribute('data-comment-id', comment.id);
		commentElement.setAttribute('data-creator-id', comment.creatorId);
		commentElement.setAttribute('data-content', comment.content);

		// Each comment will also have another button for further comments
		const commentContent = document.createElement("div");
		commentContent.textContent = `${comment.content}`;
		commentContent.classList.add('new-comment-info');


		const profilePicture = document.createElement('img');
		profilePicture.classList.add('comment-profile-picture');
		profilePicInsert(comment.creatorId).then(data => {
			profilePicture.src = data.image;
			profilePicture.alt = 'User pic';
		});

		const timeSince = document.createElement('p');
		timeSince.textContent = `Posted ${timeSincePost(comment.createdAt)} by`;
		timeSince.classList.add('comment-time')
		const commentCreator = document.createElement('p');
		insertCreatorName(comment.creatorId).then(data => {
			commentCreator.textContent = data.name;
		})
		commentCreator.classList.add("link");
		commentCreator.addEventListener('click', () => {
			goToPage('user-profile');
			document.getElementById("page-user-profile").setAttribute('data-user-id', comment.creatorId)
			updateUserProfile();
		})

		
		const commentButtonContainer = document.createElement('div')
		commentButtonContainer.classList.add('comment-button-container');


		const commentButton = document.createElement('button');
		commentButton.textContent = 'Reply';
		commentButton.addEventListener('click', () => {
			makeNestedComment(commentElement.getAttribute('data-comment-id'));
		})
		commentButton.classList.add('btn')
		commentButton.classList.add('btn-outline-secondary')

		const editButton = document.createElement('button');
		editButton.textContent = 'Edit Comment';
		editButton.classList.add('btn')
		editButton.classList.add('btn-outline-primary')
		editButton.addEventListener('click', () => {
			editComment(commentElement.getAttribute('data-comment-id'), comment.content);
		})
		// edit button only visible to creator or admin
		if (parseInt(userId) === comment.creatorId || currIsAdmin === "true") {
			editButton.style.display = 'block'
		} else {
			editButton.style.display = 'none'
		}

		const likeButton = document.createElement('button');
		if (comment.likes.includes(parseInt(userId))) {
			likeButton.textContent = `Liked ${comment.likes.length}`;
			likeButton.classList.add('btn-danger');
		} else {
			likeButton.textContent = `Like ${comment.likes.length}`;
			likeButton.classList.remove('btn-danger');
		}
		likeButton.classList.add('btn')
		likeButton.classList.add('comment-like-btn')


		likeButton.addEventListener('click', () => {
			const IsLiked = likeButton.classList.contains('btn-danger')
			likeButton.classList.toggle('btn-danger')
			generalApiCall('comment/like', {
				"id": comment.id,
  				"turnon": !IsLiked
			}, token, 'PUT')
				.then(data => {
					updateIndThread(getThreadId())
				})
				.catch(error => alert(error))
		})
		

		// comment button for replies only available for unlocked threads
		const threadDiv = document.getElementById("subpage-individual-thread");
		const threadLocked = threadDiv.dataset.isLocked;
		if (threadLocked === "true") {
			commentButton.style.display = 'none';
		} else {
			commentButton.style.display = 'block';
		}

		
		const commentOther = document.createElement("div");
		commentOther.classList.add('comment-other')

		commentButtonContainer.appendChild(likeButton)
		commentButtonContainer.appendChild(editButton)
		commentButtonContainer.appendChild(commentButton)

		commentOther.appendChild(profilePicture)
		commentOther.appendChild(timeSince)
		commentOther.appendChild(commentCreator)


		commentElement.appendChild(commentOther)
		commentElement.appendChild(commentContent)
		commentElement.appendChild(commentButtonContainer);


        // Indent based on level of comments
        commentElement.style.marginLeft = `${depth * 50}px`;

        // Append the comment element to the parent container
		newCommentContainer.appendChild(commentElement);

        // Recursively create child comment elements 
        const childCommentsContainer = createCommentElements(allcomments, comment.id, depth + 1);

        // Append the child comments container to the current comment element if it has replies
        if (childCommentsContainer && childCommentsContainer.childElementCount > 0) {
			newCommentContainer.appendChild(childCommentsContainer);

        }

		// finally append new coment contianer to main comment container
		commentsContainer.appendChild(newCommentContainer);

    });

    return parentCommentId === null ? null : commentsContainer;
}


function makeNestedComment(parentCommentId) {
	document.getElementById("nested-comment-modal").style.display = 'block';
	document.getElementById("nested-comment-modal").setAttribute("data-parent-comment-id", parentCommentId);
}

document.getElementById("close-nested-comment-modal").addEventListener('click', () => {
	document.getElementById("nested-comment-modal").style.display = 'none';
})

function editComment(commentId, content) {
	document.getElementById("edit-comment-modal").style.display = 'block';
	document.getElementById("edit-comment-modal").setAttribute("comment-id", commentId);
	document.getElementById("edit-comment-content").textContent = content;
}

document.getElementById("close-edit-comment-modal").addEventListener('click', () => {
	document.getElementById("edit-comment-modal").style.display = 'none';
})

document.getElementById("confirm-nested-comment").addEventListener('click', () => {
	const newContent = document.getElementById("new-nested-comment-content").value;

	const parentCommentId = document.getElementById("nested-comment-modal").getAttribute("data-parent-comment-id");

	generalApiCall('comment', {
		"content": newContent,
		"threadId": getThreadId(),
		"parentCommentId": parentCommentId
	}, token, 'POST')
		.then(data => {

			document.getElementById("new-nested-comment-content").value = '';
			document.getElementById("nested-comment-modal").style.display = 'none';
			updateIndThread(getThreadId())
		})
		.catch(error => alert(error))
})

document.getElementById("confirm-edit-comment").addEventListener('click', () => {
	const newContent = document.getElementById("edit-comment-content").value;
	const commentId = document.getElementById("edit-comment-modal").getAttribute("comment-id");
	generalApiCall('comment', {
		"id": commentId,
  		"content": newContent
	}, token, 'PUT')
		.then(data => {

			document.getElementById("edit-comment-modal").style.display = 'none';
			updateIndThread(getThreadId())
		})
		.catch(error => alert(error))
})

function getThreadId() {
	const threadDiv = document.getElementById("subpage-individual-thread");
	const threadId = threadDiv.dataset.threadId;
	return threadId;
}

function updateUserProfile() {

	const currentUser = userId;
	const profileuserId = document.getElementById("page-user-profile").dataset.userId;


	// show update user button if user is on own profile
	if (currentUser === profileuserId) {
		document.getElementById("update-user-details").style.display = 'block';
	} else {
		document.getElementById("update-user-details").style.display = 'none';
	}

	// change admin select only visible to admins
	if (currIsAdmin === "true") {
		document.getElementById("change-admin-form").style.display = 'block';
	} else {
		document.getElementById("change-admin-form").style.display = 'none';
	}

	const userName = document.getElementById("user-name");
	const userEmail = document.getElementById("user-email");
	const isAdmin = document.getElementById("user-admin");
	const threadsWatched = document.getElementById("threads-watched");
	const profilePic = document.getElementById("profile-pic");
	const adminSelectStatus = document.getElementById("admin-status-select");
	findThreadsByUser(profileuserId);

	generalGetApiCall('user', {
		userId: profileuserId
	}, token)
		.then(data => {

			userName.textContent = `Name: ${data.name}`
			userEmail.textContent = `Email: ${data.email}`
			isAdmin.textContent = `Role: ${data.admin? 'Admin' : 'Non-Admin'}`
			adminSelectStatus.value = data.admin ? '1' : '2'
			fetchThreadsWatching(data.threadsWatching)
			if (data.image !== null) {
				profilePic.src = data.image;
			}
		})
		.catch(error => alert(error))
}

document.getElementById("change-admin-form").addEventListener('submit', (event) => {
	event.preventDefault();
	const newStatus = document.getElementById("admin-status-select").value === '1' ? true : false;
	const profileUser = parseInt(document.getElementById("page-user-profile").dataset.userId);
	generalApiCall('user/admin', {
		"userId": profileUser,
		"turnon": newStatus
	}, token, 'PUT')
		.then(data => {
			document.getElementById("change-admin-form").style.display = 'none';
			if (profileUser === parseInt(userId) && newStatus === false) {
				currIsAdmin = false;
				localStorage.setItem('currIsAdmin', false);
			}
			updateUserProfile();
		})
		.catch(error => alert(error))
})

document.getElementById("update-user-details").addEventListener('click', () => {
	document.getElementById("update-profile-modal").style.display = 'block';
})

document.getElementById("close-update-profile-modal").addEventListener('click', () => {
	document.getElementById("update-profile-modal").style.display = 'none';
})

document.getElementById("updateProfileForm").addEventListener('submit', (event) => {
	event.preventDefault();
	const newEmail = document.getElementById("new-email").value;
	const newPassword = document.getElementById("new-password").value;
	const newName = document.getElementById("new-name").value;
	const newProfilePic = document.getElementById("new-profile-pic").files[0];

	fileToDataUrl(newProfilePic).then(dataUrl => {
		generalApiCall('user', {
			"email": newEmail,
			"password": newPassword,
			"name": newName,
			"image": dataUrl
		}, token, 'PUT')
			.then(data => {
				document.getElementById("update-profile-modal").style.display = 'none';
				updateUserProfile();
			})
			.catch(error => alert(error))
	})
})

function profilePicInsert(userId) {
	return new Promise((resolve, reject) => {
		generalGetApiCall('user', {
			userId: userId
		}, token)
			.then(data => resolve(data))
			.catch(error => reject(error))
	})
}

function insertCreatorName(userId) {
	return new Promise((resolve, reject) => {
		generalGetApiCall('user', {
			userId: userId
		}, token)
			.then(data => resolve(data))
			.catch(error => reject(error))
	})
}



function findThreadsByUser(profileUserId) {

	threadsByUser = [];
	document.getElementById("user-thread-list").textContent = '';
	let start = 0;

    function fetchThreads(start) {
        return generalGetApiCall('threads', { start: start }, token)
            .then(threadIds => {
                if (threadIds.length === 0) {
                    return;
                }
                return Promise.all(
                    threadIds.map(threadId => generalGetApiCall('thread', { id: threadId }, token))
                ).then(data => {
					const userThreads = data.filter(thread => thread.creatorId === parseInt(profileUserId));
                    threadsByUser.push(...userThreads);

                    if (threadIds.length === 5) {
                        return fetchThreads(start + 5); 
                    }
                });
            })
            .catch(error => {
                console.error('Error fetching threads:', error);
            });
		
    }
	fetchThreads(start).then(() => {
		makeUserThreadDOM();
    });

}

function makeUserThreadDOM() {
	for (const entry of threadsByUser) {
		let numComments = 0;
		generalGetApiCall('comments', {
			threadId: entry.id
		}, token).then(data => {
			numComments = data.length;
			const div = document.createElement('div');
			div.classList.add('user-threads-created')
			const p1 = document.createElement('p');
			const t1 = document.createTextNode(`Title: ${entry.title} Likes: ${entry.likes.length} ❤️ Comments: ${numComments}`);
			const t2 = document.createTextNode(` Content: ${entry.content}`);
			p1.appendChild(t1);
			p1.appendChild(document.createElement('br'));
			p1.appendChild(t2);
			div.appendChild(p1);
			document.getElementById("user-thread-list").appendChild(div);
		})
	}
}

function fetchThreadsWatching(threadsWatching) {
    // Create an array of promises for fetching each thread
    const threadPromises = threadsWatching.map(threadId => {
        return generalGetApiCall('thread', { id: threadId }, token);
    });

    Promise.all(threadPromises)
        .then(threadData => {

            const watchListContainer = document.getElementById("threads-watched");
            watchListContainer.textContent = '';

            threadData.forEach(thread => {
                // Create a new div for the thread
                const threadDiv = document.createElement('div');
                threadDiv.classList.add('watch-thread-container')
				const t1 = document.createTextNode(`Title: ${thread.title} `);
				threadDiv.appendChild(t1);
                watchListContainer.appendChild(threadDiv);
            });
        })
        .catch(error => {
            console.error('Error fetching threads:', error);
        });
}

document.getElementById("thread-creator-link").addEventListener('click', () => {
	const threadDiv = document.getElementById("subpage-individual-thread");
	const creator = threadDiv.dataset.creatorId;
	goToPage('user-profile');
	document.getElementById("page-user-profile").setAttribute('data-user-id', creator);
	updateUserProfile();
})

document.getElementById("toggle-sidebar").addEventListener('click', () => {
	const sidebar = document.getElementById("thread-list-sidebar");
	if (sidebar.style.display === 'block') {
		sidebar.style.display = 'none'
		document.getElementById("toggle-sidebar").textContent = 'Threads ▶';
		// document.getElementById("subpage-dashboard-content").style.paddingLeft = '120px';
		// document.getElementById("subpage-individual-thread").style.paddingLeft = '120px';
	} else {
		sidebar.style.display = 'block'; 
		document.getElementById("toggle-sidebar").textContent = 'Threads ◀';
		// document.getElementById("subpage-dashboard-content").style.paddingLeft = '400px';
		// document.getElementById("subpage-individual-thread").style.paddingLeft = '400px';
	}
})











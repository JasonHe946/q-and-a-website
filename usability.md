Alt tags have been included for the profile pictures of users in several areas:
If you are on a user's profile and the img src for profile pic is null, "user profile picture" will appear
If you are on a thread and the thread creator's profile pic is null, "thread creator picture" will appear
If the comment creator's profile pic is null, "user pic" as an alt tag will appear
Using these alt tags provides the user with more information on what the image is and makes the experience more robust
since the user still knows what the picture is supposed to be even if it fails to load.

Easy navigation
All buttons to go between pages are listed at the nav bar at the top and this remains constant throughout all 
pages. Buttons to log out, navigate to dashboard and view user profile is always in the same spot when logged in
and is always accessible making it easy to users to understand what actions they can take

Button hover response
All buttons when hovered over changes the cursor from a pointer to a grabbing hand cursor to signify that you can press
on the button, it also slightly changes colour. This improves the usability of the website as users are better informed on the implications of their mouse actions. 

Mobile responsiveness
When the screen size becomes smaller and the thread list sidebar on the dashboard page comes too dominating on the screen
and makes the actual thread content too small and cramped up, a toggle thread list sidebar button becomes usable. This allows
the user to toggle in and out of the thread list sidebar pick a particular thread and then hide this thread list sidebar
so that the individual thread content can now take up the whole page. This is especially useful on smaller devices where
the user does not need to see all the other threads when they are looking at a specific thread but when they want to switch
between threads they can easily do so through a toggle button.

Text and divs are scalable
When screen sizes change, all text is defined using rem and all major divs have a % width instead of a defined pixel width.
This means that when the screen size gets smaller, all the content will naturally shrink preserving the size of text and elements
relative to each other on a full desktop screen.

Better colour coordination
The thread list bar, indiviudal thread components on the thread list bar as well as all primary buttons all have the same hue value
in the hsl() in style.css. This ensures that the colours of the page are in harmony with each other mathematically and provide a more
pleasant user experience. 

Responsiveness sizes
General laptop / desktop sizes (2560px x 1600px)
Tablet - Surface Pro 7  (912px x 1368px)
Phone Screen - Iphone 12 Pro   (390px x 844px)
PLEASE NOTE: when changing from phone screen to a larger screen, please ensure the threads are toggled on otherwise they 
disappear for larger screens because the toggle button is no longer displayed for bigger screens

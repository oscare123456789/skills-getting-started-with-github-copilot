document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Helper: create small avatar element from email
  function createAvatar(email) {
    const initials = (email.split('@')[0] || '').slice(0, 2).toUpperCase() || 'U';
    const span = document.createElement('span');
    span.className = 'avatar';
    span.textContent = initials;
    return span;
  }

  // Helper: render participants list (ul) or a small empty note
  function renderParticipantsList(participants) {
    if (!participants || participants.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'participants-empty';
      empty.textContent = 'No participants yet';
      return empty;
    }

    const ul = document.createElement('ul');
    ul.className = 'participants-list';
    participants.forEach((p) => {
      const li = document.createElement('li');
      li.appendChild(createAvatar(p));
      const span = document.createElement('span');
      span.className = 'participant-email';
      span.textContent = p;
      li.appendChild(span);
      ul.appendChild(li);
    });
    return ul;
  }

  // Function to fetch activities from API and render cards with participants
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message / previous cards
      activitiesList.innerHTML = "";

      // Remove previously generated options
      activitySelect.querySelectorAll('option[data-generated]').forEach(o => o.remove());

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const title = document.createElement('h4');
        title.textContent = name;
        activityCard.appendChild(title);

        const desc = document.createElement('p');
        desc.textContent = details.description;
        activityCard.appendChild(desc);

        const sched = document.createElement('p');
        sched.innerHTML = `<strong>Schedule:</strong> ${details.schedule}`;
        activityCard.appendChild(sched);

        const spotsLeft = details.max_participants - details.participants.length;
        const avail = document.createElement('p');
        avail.innerHTML = `<strong>Availability:</strong> ${spotsLeft} spots left`;
        activityCard.appendChild(avail);

        // Participants section (header + badge + list)
        const participantsSection = document.createElement('div');
        participantsSection.className = 'participants-section';

        const header = document.createElement('div');
        header.className = 'participants-header';
        header.textContent = 'Participants';

        const badge = document.createElement('span');
        badge.className = 'badge';
        badge.textContent = details.participants.length;
        header.appendChild(badge);
        participantsSection.appendChild(header);

        participantsSection.appendChild(renderParticipantsList(details.participants));
        activityCard.appendChild(participantsSection);

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown (mark as generated)
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        option.setAttribute('data-generated', '1');
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // refresh to show newly added participant
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});

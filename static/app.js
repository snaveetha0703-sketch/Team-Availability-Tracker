// Load team members from backend
async function loadMembers() {

    try {
        const response = await fetch("/api/members");

        if (!response.ok) {
            throw new Error("Unable to load members");
        }

        const members = await response.json();

        const list = document.getElementById("memberList");

        list.innerHTML = "";

        let availableCount = 0;
        let busyCount = 0;
        let awayCount = 0;

        members.forEach(member => {

            if (member.status === "Available") {
                availableCount++;
            } else if (member.status === "Busy") {
                busyCount++;
            } else if (member.status === "Away") {
                awayCount++;
            }

            const card = document.createElement("div");
            card.className = "member-card";

            const name = document.createElement("span");
            name.className = "member-name";
            name.textContent = member.name;

            const badge = document.createElement("span");
            badge.className = "status " + member.status;
            badge.textContent = member.status;

            const select = document.createElement("select");

            ["Available", "Busy", "Away"].forEach(status => {
                const option = document.createElement("option");
                option.value = status;
                option.textContent = status;

                if (status === member.status) {
                    option.selected = true;
                }

                select.appendChild(option);
            });

            select.addEventListener("change", () => {
                updateStatus(member.id, select.value);
            });

            const deleteButton = document.createElement("button");
            deleteButton.className = "delete-btn";
            deleteButton.textContent = "Delete";

            deleteButton.addEventListener("click", () => {
                deleteMember(member.id);
            });

            const actions = document.createElement("div");
            actions.className = "member-actions";

            actions.append(badge, select, deleteButton);

            card.append(name, actions);

            list.appendChild(card);
        });

        if (members.length === 0) {
            list.textContent = "No team members added yet.";
        }

        // Update summary numbers
        document.getElementById("total").textContent =
            members.length;

        document.getElementById("available").textContent =
            availableCount;

        document.getElementById("busy").textContent =
            busyCount;

        document.getElementById("away").textContent =
            awayCount;

    } catch (error) {
        document.getElementById("memberList").textContent =
            "Unable to connect to the server.";
    }
}


// Add a new member
document.getElementById("memberForm").addEventListener(
    "submit",
    async function(event) {

        event.preventDefault();

        const name = document.getElementById("memberName").value;

        const response = await fetch("/api/members", {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                name: name
            })
        });

        const data = await response.json();

        document.getElementById("message").textContent =
            data.message || data.error;

        if (response.ok) {
            document.getElementById("memberName").value = "";
            loadMembers();
        }
    }
);


// Update member status
async function updateStatus(id, status) {

    const response = await fetch("/api/members/" + id, {
        method: "PATCH",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            status: status
        })
    });

    if (response.ok) {
        loadMembers();
    }
}


// Delete a member
async function deleteMember(id) {

    const response = await fetch("/api/members/" + id, {
        method: "DELETE"
    });

    if (response.ok) {
        loadMembers();
    }
}


// Initial dashboard load
loadMembers();


// Refresh dashboard every 3 seconds
setInterval(loadMembers, 3000);
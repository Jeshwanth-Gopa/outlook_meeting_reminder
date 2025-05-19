import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  InputAdornment,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TextField,
  TableHead,
  TableRow,
  Typography,
  IconButton,
  Paper
} from "@mui/material";
import AccountMeetings from "./AccountMeetings";
import RefreshIcon from '@mui/icons-material/Refresh';
import AutorenewIcon from '@mui/icons-material/Autorenew';

function UpcomingMeetings() {
  const [remindBefore, setRemindBefore] = React.useState("5");
  const [meetings, setMeetings] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [newRingAt, setNewRingAt] = useState("");
  const [filterDays, setFilterDays] = useState(10);
  const [meetingLimit, setMeetingLimit] = useState(5);
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);

  const handleEdit = (id, ringAt) => {
    setEditingId(id);
    const timePart = ringAt.split("T")[1]?.slice(0, 5); // "HH:MM"
    setNewRingAt(timePart);
  };

  const handleSave = (meeting) => {
    const [hour, minute] = newRingAt.split(":").map(Number);

    const start = new Date(meeting.rawStart); // ✅ Using unmodified rawStart
    const newRing = new Date(meeting.rawStart); // Base it on same day

    newRing.setHours(hour);
    newRing.setMinutes(minute);
    newRing.setSeconds(0);

    if (newRing >= start) {
      alert("ring_at must be earlier than start time");
      return;
    }

    const pad = (n) => n.toString().padStart(2, '0');
    const ringIso = `${newRing.getFullYear()}-${pad(newRing.getMonth() + 1)}-${pad(newRing.getDate())}T${pad(newRing.getHours())}:${pad(newRing.getMinutes())}:00`;

    fetch("http://127.0.0.1:5000/set_alarm_particular_meeting", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: meeting.id, ring_at: ringIso }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") {
          alert("Alarm updated!");

          const updated = meetings.map((m) =>
            m.id === meeting.id
              ? {
                ...m,
                rawRingAt: ringIso,
                ringTime: newRing.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              }
              : m
          );

          setMeetings(updated);
          setEditingId(null);
        } else {
          alert("Failed to update alarm.");
        }
      });
  };

  const handleSaveRingBefore = () => {
    fetch("http://127.0.0.1:5000/set_ring_before", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ring_before: parseInt(remindBefore, 10) }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") {
          alert(`Reminder set to ${remindBefore} min`);
          fetchMeetings();
        } else {
          alert("Failed to update reminder.");
        }
      })
  };

  const getSettings = async () => {
    try {
      const res = await fetch("http://127.0.0.1:5000/get_settings");
      const data = await res.json();

      if (data.status === "success") {
        const settings = data.settings;
        setRemindBefore(String(settings.ring_before)); // convert to string if used in <Select />
        setFilterDays(settings.days_ahead);
        setMeetingLimit(settings.num_meetings);
      } else {
        console.warn("Failed to fetch settings:", data.message);
      }
    } catch (err) {
      console.warn("Error fetching settings:", err);
    }
  };

  const fetchMeetings = async (isAuto = false) => {
    try {
      if (isAuto) setIsAutoRefreshing(true);
      const response = await fetch("http://127.0.0.1:5000/get_meetings");
      const data = await response.json();

      const formatted = data.meetings.map((m) => {
        const startDate = new Date(m.start);
        const endDate = new Date(m.end);
        const ringDate = new Date(m.ring_at);
        return {
          ...m,
          rawStart: m.start,
          rawEnd: m.end,
          rawRingAt: m.ring_at,
          date: startDate.toLocaleDateString(),
          startTime: startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          endTime: endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          ringTime: ringDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
      });

      setMeetings(formatted);
    } catch (error) {
      console.error("Error fetching meetings:", error);
    } finally {
      if (isAuto) {
        setTimeout(() => setIsAutoRefreshing(false), 2000); // Hide message after 2s
      }
    }
  };

  const handleFilterDays = (value) => {
    setFilterDays(value);
    fetch("http://127.0.0.1:5000/set_days_ahead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ days_ahead: value }),
    })
      .then((res) => res.json())
      .then(() => fetchMeetings());
  };

  const handleMeetingLimit = (value) => {
    setMeetingLimit(value);
    fetch("http://127.0.0.1:5000/set_num_meetings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ num: value }),
    })
      .then((res) => res.json())
      .then(() => fetchMeetings());
  };

  useEffect(() => {
    fetchMeetings(true);
    getSettings();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchMeetings(true);
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Box p={3}>
      <Box display="flex" gap={4} marginBottom={-5} flexWrap="wrap">
        {/* List of Meetings Start */}
        <Box sx={{ flex: 2, minWidth: 600 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 1,
              width: '100%'
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 800, color: "#264e6a" }}>
              Upcoming Meetings
            </Typography>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {isAutoRefreshing && (
                <AutorenewIcon
                  fontSize="small"
                  sx={{ color: "blue", animation: "spin 1s linear infinite" }}
                />
              )}
              <Button
                onClick={() => fetchMeetings(false)}
                variant="outlined"
                size="small"
                startIcon={<RefreshIcon fontSize="small" />}
              >
                Refresh
              </Button>
            </Box>
          </Box>

          <TableContainer
            component={Paper}
            sx={{
              borderRadius: 0,
              boxShadow: 3,
              maxHeight: 370,
              overflowY: "auto",
            }}
          >
            <Table stickyHeader>
              <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
                <TableRow>
                  <TableCell>
                    <strong>Subject</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Date</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Start</strong>
                  </TableCell>
                  <TableCell>
                    <strong>End</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Account</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Ring At</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {meetings.map((meeting, index) => (
                  <TableRow
                    key={meeting.id}
                    sx={{
                      backgroundColor: index % 2 === 0 ? "#fafafa" : "#ffffff",
                      "&:hover": { backgroundColor: "#f0f0f0" },
                    }}
                  >
                    <TableCell>{meeting.subject}</TableCell>
                    <TableCell>{meeting.date}</TableCell>
                    <TableCell>{meeting.startTime}</TableCell>
                    <TableCell>{meeting.endTime}</TableCell>
                    <TableCell>{meeting.account}</TableCell>
                    <TableCell>
                      {editingId === meeting.id ? (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <TextField
                            type="time"
                            size="small"
                            value={newRingAt}
                            onChange={(e) => setNewRingAt(e.target.value)}
                            inputProps={{ step: 60 }}
                          />
                          <IconButton size="small" onClick={() => handleSave(meeting)}>✅</IconButton>
                        </Box>
                      ) : (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          {meeting.ringTime}
                          <IconButton size="small" onClick={() => handleEdit(meeting.id, meeting.rawRingAt)}>
                            ✏️
                          </IconButton>
                        </Box>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
        {/* List of Meetings End */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Reminder Box Start */}
          <Card sx={{ width: 250, borderRadius: 2, boxShadow: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Remind Before
              </Typography>
              <TextField
                value={remindBefore}
                onChange={(e) => setRemindBefore(e.target.value)}
                type="number"
                size="small"
                placeholder="Enter minutes before"
                fullWidth
                sx={{ mb: 2 }}
                InputProps={{
                  endAdornment: <InputAdornment position="end">min</InputAdornment>,
                }}
              />
              <Button variant="contained" fullWidth onClick={handleSaveRingBefore}>
                Save
              </Button>
            </CardContent>
          </Card>
          {/* Reminder Box end */}
          {/* Filter Box Start */}
          <Card sx={{ width: 250, borderRadius: 2, boxShadow: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Filter Meetings
              </Typography>

              {/* Days Ahead */}
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Days Ahead</InputLabel>
                <Select
                  value={filterDays}
                  label="Days Ahead"
                  onChange={(e) => handleFilterDays(e.target.value)}
                >
                  <MenuItem value={1}>1 day</MenuItem>
                  <MenuItem value={3}>3 days</MenuItem>
                  <MenuItem value={7}>7 days</MenuItem>
                  <MenuItem value={10}>10 days</MenuItem>
                  <MenuItem value={30}>30 days</MenuItem>
                </Select>
              </FormControl>

              {/* Number of Meetings */}
              <FormControl fullWidth>
                <InputLabel>Meeting Count</InputLabel>
                <Select
                  value={meetingLimit}
                  label="Meeting Count"
                  onChange={(e) => handleMeetingLimit(e.target.value)}
                >
                  <MenuItem value={1}>1</MenuItem>
                  <MenuItem value={5}>5</MenuItem>
                  <MenuItem value={10}>10</MenuItem>
                  <MenuItem value={20}>20</MenuItem>
                </Select>
              </FormControl>
            </CardContent>
          </Card>
          {/* Filter Box end */}
        </Box>
      </Box>

      <Box mt={5}>
        <AccountMeetings meetings={meetings} />
      </Box>
    </Box>
  );
}

export default UpcomingMeetings;
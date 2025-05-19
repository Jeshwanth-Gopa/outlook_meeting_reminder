import React, { useEffect, useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';

function AccountMeetings({ meetings }) {
  const [selectedAccounts, setSelectedAccounts] = useState({});
  const [expandedAccount, setExpandedAccount] = useState(null);

  // Format meetings data with dates once meetings prop changes
  const formattedMeetings = useMemo(() => {
    return meetings.map((m, i) => ({
      ...m,
      id: i + 1,
      ringAt: new Date(m.ring_at).toLocaleString(),
      start: new Date(m.start).toLocaleString(),
      end: new Date(m.end).toLocaleString(),
    }));
  }, [meetings]);

  // Set accounts and their checkbox state on meetings change
  useEffect(() => {
    const allAccounts = [...new Set(formattedMeetings.map((m) => m.account))];
    setSelectedAccounts((prev) => {
      const updated = { ...prev };
      allAccounts.forEach((account) => {
        if (!(account in updated)) {
          updated[account] = true;
        }
      });
      return updated;
    });
  }, [formattedMeetings]);

  const handleBoxClick = (account) => {
    setExpandedAccount((prev) => (prev === account ? null : account));
  };

  const visibleAccounts = Object.entries(selectedAccounts)
    .filter(([_, isChecked]) => isChecked)
    .map(([account]) => account);

  return (
    <Box p={3} marginTop={0}>
      <Typography variant="h6" sx={{ mb: -3, fontWeight: 800, textAlign: 'left', color: '#264e6a' }}>
        List of Accounts
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 5 }}>
        {visibleAccounts.map((account) => (
          <Box key={account} sx={{ width: '100%' }}>
            <Paper
              elevation={3}
              sx={{
                padding: 2,
                borderRadius: 2,
                minWidth: 150,
                textAlign: 'center',
                backgroundColor: '#e0f7fa',
                cursor: 'pointer',
                width: 'fit-content',
              }}
              onClick={() => handleBoxClick(account)}
            >
              <Typography variant="subtitle1" fontWeight="bold">
                {account}
              </Typography>
            </Paper>

            {expandedAccount === account && (
              <TableContainer
                sx={{
                  mt: 2,
                  mb: 4,
                  borderRadius: 2,
                  backgroundColor: '#f5f5f5',
                  maxWidth: '100%',
                }}
              >
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#e0e0e0' }}>
                      <TableCell><strong>Subject</strong></TableCell>
                      <TableCell><strong>Start</strong></TableCell>
                      <TableCell><strong>End</strong></TableCell>
                      <TableCell><strong>Ring At</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {formattedMeetings
                      .filter((m) => m.account === account)
                      .map((m) => (
                        <TableRow key={m.id}>
                          <TableCell>{m.subject}</TableCell>
                          <TableCell>{m.start}</TableCell>
                          <TableCell>{m.end}</TableCell>
                          <TableCell>{m.ringAt}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        ))}
      </Box>
    </Box>
  );
}

export default AccountMeetings;

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FestiveOfferCard from './FestiveOfferCard';
import { API_ENDPOINTS } from '../config/api';

const DISMISS_KEY_PREFIX = 'catlog_offer_dismissed_';

const dismissKeyFor = (announcement) => `${DISMISS_KEY_PREFIX}${announcement._id}_${announcement.updatedAt}`;

const wasDismissed = (announcement) => {
  try {
    return sessionStorage.getItem(dismissKeyFor(announcement)) === '1';
  } catch {
    return false;
  }
};

const markDismissed = (announcement) => {
  try {
    sessionStorage.setItem(dismissKeyFor(announcement), '1');
  } catch {
    // ignore write failures (e.g. private browsing)
  }
};

const FestiveOfferPopup = () => {
  const [announcement, setAnnouncement] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let showTimer;

    const fetchOffer = async () => {
      try {
        const res = await fetch(`${API_ENDPOINTS.announcement}/active`);
        if (!res.ok) return;
        const data = await res.json();
        if (!data || !data._id) return;

        setAnnouncement(data);
        if (!wasDismissed(data)) {
          showTimer = setTimeout(() => setVisible(true), 900);
        }
      } catch (error) {
        console.error('Error fetching active announcement:', error);
      }
    };

    fetchOffer();
    return () => clearTimeout(showTimer);
  }, []);

  const handleClose = () => {
    setVisible(false);
    if (announcement) {
      markDismissed(announcement);
    }
  };

  return (
    <AnimatePresence>
      {visible && announcement && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 22, stiffness: 260 }}
            className="w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <FestiveOfferCard announcement={announcement} onClose={handleClose} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FestiveOfferPopup;
